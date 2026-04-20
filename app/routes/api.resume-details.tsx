import { updateResumeDetailsForUser } from "../lib/database/index.server";
import { getUserBySession } from "../lib/auth.server";

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("session="));
  return sessionCookie ? sessionCookie.split("=")[1] : null;
}

export async function action({ request }: { request: Request }) {
  if (request.method !== "PUT") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const resumeId = body?.resumeId;
    const companyName = body?.companyName;
    const jobTitle = body?.jobTitle;
    const jobDescription = body?.jobDescription;

    if (!resumeId || !jobTitle?.trim() || !jobDescription?.trim()) {
      return Response.json(
        { error: "Resume ID, job title, and job description are required" },
        { status: 400 }
      );
    }

    const updatedResume = await updateResumeDetailsForUser(resumeId, user.id, {
      companyName,
      jobTitle,
      jobDescription,
    });

    if (!updatedResume) {
      return Response.json({ error: "Resume not found or not authorized" }, { status: 404 });
    }

    return Response.json({ success: true, resume: updatedResume });
  } catch (error) {
    console.error("Error updating resume details:", error);
    return Response.json(
      {
        error: "Failed to update resume details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
