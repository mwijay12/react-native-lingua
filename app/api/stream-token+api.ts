// AI voice is disabled. Do not issue Stream tokens until authentication and
// authorization are implemented and reviewed for the deployed backend.
export async function GET(): Promise<Response> {
  return Response.json({ error: "AI voice is not available yet." }, { status: 503 });
}
