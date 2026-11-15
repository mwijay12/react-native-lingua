// AI sessions are intentionally disabled. The previous route accepted
// unauthenticated requests; do not re-enable it without proper authentication,
// call ownership checks, rate limits, and a secure agent deployment.
function disabled(): Response {
  return Response.json({ error: "AI sessions are not available yet." }, { status: 503 });
}

export async function POST(): Promise<Response> {
  return disabled();
}

export async function DELETE(): Promise<Response> {
  return disabled();
}
