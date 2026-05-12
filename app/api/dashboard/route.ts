import { requireApiSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiSession();

    const payload = await getDashboardData();
    return Response.json(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
