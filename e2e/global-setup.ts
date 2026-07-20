// Runs once after the dev webServer is up, before the specs. Hitting each route
// the suite uses triggers next dev's on-demand compile ahead of time, so the
// tests themselves don't race a cold 20s+ compile on the first navigation.
// Sequential on purpose: firing all compiles at once thrashes the dev server
// and can leave the first specs racing a still-compiling route.
export default async function globalSetup() {
  const base = "http://localhost:3100";
  const routes = [
    "/en",
    "/ar",
    "/en/collections/joy",
    "/en/products/joy-basin-mixer",
    "/en/contact",
    "/en/trade",
    "/admin/login",
  ];
  for (const route of routes) {
    await fetch(`${base}${route}`).catch(() => {
      /* warm-up best effort — a failed prefetch just means the test pays the compile */
    });
  }
}
