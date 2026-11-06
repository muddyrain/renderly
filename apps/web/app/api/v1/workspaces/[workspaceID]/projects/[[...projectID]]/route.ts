import { proxyProjects } from "@/lib/server/project-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: Request,
  context: { params: Promise<{ workspaceID: string; projectID?: string[] }> },
) {
  const params = await context.params;
  return proxyProjects(request, params.workspaceID, params.projectID ?? [], {
    mode: process.env.RENDERLY_PROJECTS_MODE ?? "demo",
    origin: process.env.RENDERLY_API_ORIGIN ?? "",
    workspaceId: process.env.RENDERLY_WORKSPACE_ID ?? "",
  });
}
export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
};
