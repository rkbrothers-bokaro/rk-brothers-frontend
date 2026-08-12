// Backend wraps single-object payloads as { success, data }. This unwraps
// that envelope, falling back to the body itself when it isn't wrapped.
export function unwrapEnvelope(body) {
  return body && body.data !== undefined ? body.data : body;
}
