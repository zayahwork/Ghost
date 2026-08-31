/** How the signed-in user relates to a project. */
export type ProjectRole = "owner" | "collaborator";

export interface Project {
  id: string;
  name: string;
  /** URL-safe identifier derived from the name. */
  slug: string;
  /**
   * Owners get the rename and delete actions; collaborators see the project
   * listed under "Shared" with no actions.
   */
  role: ProjectRole;
}
