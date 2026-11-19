// AI chat is deliberately fail-closed. Before connecting a provider, the
// deployed backend must verify Clerk sessions, enforce per-user rate and spend
// limits, validate input, and keep provider credentials in server secrets.
// Adding a key alone must never turn this into an unauthenticated AI proxy.
export async function POST(): Promise<Response> {
  return Response.json(
    { error: "AI chat is not connected yet." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
