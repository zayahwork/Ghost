import { prisma } from "@/lib/prisma";
import { requireOwnedProject, requireUserId } from "@/lib/project-access";
import { parseRenameProjectInput } from "@/lib/project-input";
import { toProjectResponse } from "@/lib/project-response";

/** Renames a project. Owner only. */
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
): Promise<Response> {
  const user = await requireUserId();

  if (!user.ok) {
    return user.response;
  }

  const input = await parseRenameProjectInput(request);

  if (!input.ok) {
    return input.response;
  }

  const { projectId } = await context.params;
  const owned = await requireOwnedProject(projectId, user.value);

  if (!owned.ok) {
    return owned.response;
  }

  const project = await prisma.project.update({
    where: { id: owned.value.id },
    data: { name: input.value.name },
  });

  return Response.json({ project: toProjectResponse(project) });
}

/** Deletes a project. Owner only. */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
): Promise<Response> {
  const user = await requireUserId();

  if (!user.ok) {
    return user.response;
  }

  const { projectId } = await context.params;
  const owned = await requireOwnedProject(projectId, user.value);

  if (!owned.ok) {
    return owned.response;
  }

  // Collaborator rows go with it — the relation cascades on delete.
  await prisma.project.delete({ where: { id: owned.value.id } });

  // The record as it stood at deletion, so a client can undo its own list state.
  return Response.json({ project: toProjectResponse(owned.value) });
}
