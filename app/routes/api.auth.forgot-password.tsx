import type { Route } from "./+types/api.auth.forgot-password";
import { createPasswordResetToken } from "../lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Get IP address from request headers
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";

    // Create reset token
    const result = await createPasswordResetToken(email, ipAddress);

    // Always return success to prevent email enumeration
    // In production, send email with reset link
    if (result) {
      const resetUrl = `${new URL(request.url).origin}/reset-password?token=${result.token}`;
      
      // TODO: Send email with reset link
      // For now, just log it to console (development only)
      console.log('==============================================');
      console.log('PASSWORD RESET REQUEST');
      console.log('==============================================');
      console.log('Email:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Token expires in 1 hour');
      console.log('==============================================');
    }

    // Always return success message (even if email doesn't exist)
    return Response.json({ 
      success: true,
      message: "If that email exists, a password reset link has been sent" 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
