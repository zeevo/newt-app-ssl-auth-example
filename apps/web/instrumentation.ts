// Starts the Nest context when the server boots, before it takes requests, so
// startup work (creating the INITIAL_ADMIN_* admin) happens up front and bad
// configuration fails the boot instead of the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getContext } = await import("@/lib/nest");
    await getContext();
  }
}
