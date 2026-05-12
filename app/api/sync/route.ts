import { requireApiSession } from "@/lib/auth";
import { GitHubApiError, syncGitHubRepositories } from "@/lib/github";
import { errorResponse, readJsonBody } from "@/lib/http";
import { syncRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireApiSession();
    await readJsonBody(request, syncRequestSchema, {});

    const summary = await syncGitHubRepositories();
    return Response.json(summary);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return Response.json({ error: error.userMessage }, { status: error.status });
    }

    return errorResponse(error);
  }
}
