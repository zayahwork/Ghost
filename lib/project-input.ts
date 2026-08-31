import { badRequest, type Guard } from "@/lib/api-response";

/** Applied when a project is created without a name of its own. */
export const DEFAULT_PROJECT_NAME = "Untitled Project";

/**
 * Bounded so a single request cannot write an unbounded string into a column
 * the sidebar has to render.
 */
const MAX_NAME_LENGTH = 120;

export interface ProjectNameInput {
  name: string;
}

/**
 * Reads the body as a JSON object. An absent body is `{}` rather than an error,
 * because `POST /api/projects` is meaningful with nothing in it — the name is
 * optional and everything else is defaulted by the schema.
 */
async function readJsonObject(
  request: Request,
): Promise<Guard<Record<string, unknown>>> {
  const raw = await request.text();

  if (raw.trim() === "") {
    return { ok: true, value: {} };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON.") };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      response: badRequest("Request body must be a JSON object."),
    };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}

function tooLong(): Response {
  return badRequest(`\`name\` must be ${MAX_NAME_LENGTH} characters or fewer.`);
}

/**
 * Create treats a blank name the same as a missing one: both mean the user did
 * not choose, and that is answered with the default rather than a 400. A name
 * of the wrong type is still a client error — it is a malformed request, not an
 * omitted field.
 */
export async function parseCreateProjectInput(
  request: Request,
): Promise<Guard<ProjectNameInput>> {
  const body = await readJsonObject(request);

  if (!body.ok) {
    return body;
  }

  const { name } = body.value;

  if (name !== undefined && name !== null && typeof name !== "string") {
    return { ok: false, response: badRequest("`name` must be a string.") };
  }

  const trimmed = typeof name === "string" ? name.trim() : "";

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, response: tooLong() };
  }

  return {
    ok: true,
    value: { name: trimmed === "" ? DEFAULT_PROJECT_NAME : trimmed },
  };
}

/**
 * Rename has no default. An omitted or blank name is the caller failing to say
 * what the new name is, not a request to be called "Untitled Project".
 */
export async function parseRenameProjectInput(
  request: Request,
): Promise<Guard<ProjectNameInput>> {
  const body = await readJsonObject(request);

  if (!body.ok) {
    return body;
  }

  const { name } = body.value;

  if (typeof name !== "string") {
    return {
      ok: false,
      response: badRequest("`name` is required and must be a string."),
    };
  }

  const trimmed = name.trim();

  if (trimmed === "") {
    return { ok: false, response: badRequest("`name` must not be empty.") };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, response: tooLong() };
  }

  return { ok: true, value: { name: trimmed } };
}
