import type { ProjectModel } from "@/app/generated/prisma/models";
import type { ProjectStatus } from "@/app/generated/prisma/enums";

/**
 * The wire shape of a project. Declared separately from the Prisma model so
 * the response contract does not silently widen when a column is added, and so
 * timestamps are typed as the ISO strings a client actually receives rather
 * than the `Date` objects Prisma returns.
 */
export interface ProjectResponse {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  canvasJsonPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toProjectResponse(project: ProjectModel): ProjectResponse {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    description: project.description,
    status: project.status,
    canvasJsonPath: project.canvasJsonPath,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
