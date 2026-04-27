import type { Route } from "./+types/api.auth.change-password";
import { getUserBySession, validatePasswordStrength, updateUserPassword } from "../lib/auth.server";
import { safeConsole } from "../lib/logging";

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session_token='));
  
  if (sessionCookie) {
    return sessionCookie.substring('session_token='.length);
  }
  
  return null;
}

async function verifyPasswordAgainstHash(
  password: string,
  hash: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!hash) return { isValid: false, needsRehash: false };

  if (hash.startsWith('sha256:')) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const isValid = `sha256:${hashHex}` === hash;
    return { isValid, needsRehash: isValid };
  }

  try {
    const argon2Module = await import('argon2');
    const isValid = await argon2Module.default.verify(hash, password);
    if (!isValid) {
      return { isValid: false, needsRehash: false };
    }

    const ARGON2_CONFIG = {
      type: argon2Module.default.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    };

    return {
      isValid: true,
      needsRehash: argon2Module.default.needsRehash(hash, ARGON2_CONFIG),
    };
  } catch {
    return { isValid: false, needsRehash: false };
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get session token
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from session
    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json(
        { error: "Current password, new password, and confirmation are required" },
        { status: 400 }
      );
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return Response.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    // Check new password is different from current
    if (currentPassword === newPassword) {
      return Response.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Verify current password
    const verification = await verifyPasswordAgainstHash(
      currentPassword,
      user.password_hash
    );

    if (!verification.isValid) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordPolicy = validatePasswordStrength(newPassword);
    if (!passwordPolicy.valid) {
      return Response.json(
        {
          error: passwordPolicy.message || "Password does not meet security requirements"
        },
        { status: 400 }
      );
    }

    // Update password
    const success = await updateUserPassword(user.id, newPassword);

    if (!success) {
      return Response.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Password changed successfully",
      needsRehash: verification.needsRehash
    });

  } catch (error) {
    safeConsole.error('Change password error:', error);
    return Response.json(
      { error: "An error occurred changing your password" },
      { status: 500 }
    );
  }
}
