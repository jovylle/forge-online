import { requireApiSession } from "@/lib/auth";
import { getRepoMetadata, upsertRepoMetadata } from "@/lib/db";
import { errorResponse, readJsonBody } from "@/lib/http";
import { repoMetadataSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type MetadataRouteContext = {
  params: Promise<{
    repoId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: MetadataRouteContext,
) {
  try {
    await requireApiSession();
    const { repoId } = await context.params;

    const metadata = await getRepoMetadata(repoId);
    return Response.json({ metadata });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: MetadataRouteContext,
) {
  try {
    await requireApiSession();
    const { repoId } = await context.params;
    const input = await readJsonBody(request, repoMetadataSchema);
    const metadata = await upsertRepoMetadata(repoId, input);

    return Response.json({ metadata });
  } catch (error) {
    return errorResponse(error);
  }
}
