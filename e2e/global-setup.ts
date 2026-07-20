// Runs once after the dev webServer is up, before the specs. Hitting each route
// the suite uses triggers next dev's on-demand compile ahead of time, so the
// tests themselves don't race a cold 20s+ compile on the first navigation.
export default async function globalSetup() {
  const base = "http://localhost:3100";
  const routes = [
    "/en",
    "/ar",
    "/en/collections/joy",
    "/en/products/joy-basin-mixer",
    "/en/contact",
    "/admin/login",
  ];
  await Promise.all(
    routes.map((r) =>
      fetch(`${base}${r}`).catch(() => {
        /* warm-up best effort — a failed prefetch just means the test pays the compile */
      })
    )
  );
}
