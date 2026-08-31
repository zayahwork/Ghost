import { auth } from "@clerk/nextjs/server";

import type { ProjectModel } from "@/app/generated/prisma/models";
import { forbidden, notFound, unauthorized, type Guard } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * The Clerk user ID of the caller. Identity lives in Clerk, so this string is
 * also what `Project.ownerId` holds — no local user table sits between them.
 */
export async function requireUserId(): Promise<Guard<string>> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, response: unauthorized() };
  }

  return { ok: true, value: userId };
}

/**
 * Loads a project only for the user who owns it.
 *
 * A project that belongs to someone else answers 403 rather than 404: the
 * caller is authenticated and the resource exists, and collapsing the two into
 * a 404 would leave a collaborator unable to tell "not yours" from "gone".
 */
export async function requireOwnedProject(
  projectId: string,
  userId: string,
): Promise<Guard<ProjectModel>> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    return { ok: false, response: notFound("Project not found.") };
  }

  if (project.ownerId !== userId) {
    return {
      ok: false,
      response: forbidden("Only the project owner can modify this project."),
    };
  }

  return { ok: true, value: project };
}
