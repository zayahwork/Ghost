import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/project-access";
import { parseCreateProjectInput } from "@/lib/project-input";
import { toProjectResponse } from "@/lib/project-response";

/** Projects owned by the signed-in user, newest first. */
export async function GET(): Promise<Response> {
  const user = await requireUserId();

  if (!user.ok) {
    return user.response;
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: user.value },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects: projects.map(toProjectResponse) });
}

/** Creates a project owned by the signed-in user. */
export async function POST(request: Request): Promise<Response> {
  const user = await requireUserId();

  if (!user.ok) {
    return user.response;
  }

  const input = await parseCreateProjectInput(request);

  if (!input.ok) {
    return input.response;
  }

  // `id` is omitted deliberately: the schema's `@default(cuid())` owns it.
  const project = await prisma.project.create({
    data: { ownerId: user.value, name: input.value.name },
  });

  return Response.json({ project: toProjectResponse(project) }, { status: 201 });
}
