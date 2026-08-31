/**
 * Every failed request answers with this one body, so a client can read the
 * reason without branching on which route produced it.
 */
export interface ApiErrorBody {
  error: string;
}

/**
 * The result of a check that a handler cannot continue past. Carrying the
 * response rather than throwing keeps the failure path visible in the route:
 * the handler either reads `value` or returns `response`, and there is no third
 * option the type system will let it forget.
 */
export type Guard<T> =
  | { ok: true; value: T }
  | { ok: false; response: Response };

function apiError(status: number, message: string): Response {
  return Response.json({ error: message } satisfies ApiErrorBody, { status });
}

/** The request was understood but its body is not usable. */
export function badRequest(message: string): Response {
  return apiError(400, message);
}

/** No signed-in user. Distinct from `forbidden` — signing in would fix it. */
export function unauthorized(): Response {
  return apiError(401, "Authentication required.");
}

/** A signed-in user asking for something that is not theirs. */
export function forbidden(
  message = "You do not have access to this resource.",
): Response {
  return apiError(403, message);
}

/** The addressed resource does not exist for anyone. */
export function notFound(message = "Resource not found."): Response {
  return apiError(404, message);
}
