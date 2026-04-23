import type { Route } from "./+types/api.auth.reset-password";
import { resetPasswordWithToken } from "../lib/auth.server";
import { safeConsole } from "../lib/logging";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Reset password using token
    const success = await resetPasswordWithToken(token, password);

    if (!success) {
      return Response.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    return Response.json({ 
      success: true,
      message: "Password reset successfully" 
    });

  } catch (error) {
    safeConsole.error('Reset password error:', error);
    return Response.json(
      { error: "An error occurred resetting your password" },
      { status: 500 }
    );
  }
}
