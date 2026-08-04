import { readFile } from "node:fs/promises";
import process from "node:process";

const root = new URL("../", import.meta.url);
const scenarios = JSON.parse(
  await readFile(new URL("data/assistant-use-cases.json", root), "utf8")
);

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const category = valueAfter("--category");
const scenarioId = valueAfter("--id");
const limit = Number(valueAfter("--limit") || 0);
const runAll = args.includes("--all");
const verbose = args.includes("--verbose");
const baseUrl = process.env.ASSISTANT_BASE_URL || "http://localhost:3000";
const delayMs = Number(valueAfter("--delay-ms") || 700);
const force = args.includes("--force");

// The endpoint enforces 20 requests per 10 minutes (app/api/assistant/route.ts),
// so a full default run (30 critical scenarios) always trips it. Requests past
// the limit are reported as skipped rather than as model failures.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;

class RateLimitError extends Error {
  constructor() {
    super("HTTP 429 (rate limited)");
    this.name = "RateLimitError";
  }
}

let selected = scenarios.filter((scenario) => runAll || scenario.priority === "critical");
if (category) {
  selected = selected.filter((scenario) =>
    scenario.category.toLowerCase().includes(category.toLowerCase())
  );
}
if (scenarioId) selected = selected.filter((scenario) => scenario.id === scenarioId);
if (limit > 0) selected = selected.slice(0, limit);

function extractRich(raw) {
  const start = raw.indexOf('{"type"');
  if (start < 0) return null;
  try {
    return JSON.parse(raw.slice(start));
  } catch {
    return null;
  }
}

function checkScenario(scenario, raw) {
  const expected = scenario.expected || {};
  const lower = raw.toLowerCase().normalize("NFKC").replace(/\s+/g, " ");
  const rich = extractRich(raw);
  const failures = [];

  if (!raw.trim()) failures.push("empty response");
  if (expected.mode === "plain" && rich) failures.push(`expected plain, received ${rich.type}`);
  if (expected.mode && expected.mode !== "plain" && expected.mode !== "any" && rich?.type !== expected.mode) {
    failures.push(`expected ${expected.mode}, received ${rich?.type || "plain"}`);
  }
  if (expected.expectedSeries && rich?.series !== expected.expectedSeries) {
    failures.push(`expected series ${expected.expectedSeries}`);
  }
  if (expected.mustContainAll?.some((term) => !lower.includes(term.toLowerCase()))) {
    const missing = expected.mustContainAll.filter((term) => !lower.includes(term.toLowerCase()));
    failures.push(`missing: ${missing.join(", ")}`);
  }
  if (
    expected.mustContainAny?.length &&
    !expected.mustContainAny.some((term) => lower.includes(term.toLowerCase()))
  ) {
    failures.push(`missing any of: ${expected.mustContainAny.join(", ")}`);
  }
  const forbidden = expected.mustNotContain?.filter((term) => lower.includes(term.toLowerCase()));
  if (forbidden?.length) failures.push(`forbidden: ${forbidden.join(", ")}`);

  return { passed: failures.length === 0, failures, rich };
}

async function ask(scenario) {
  const messages = scenario.messages || [{ role: "user", content: scenario.prompt }];
  const response = await fetch(`${baseUrl}/api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Steinheim-Evaluation": "local" },
    body: JSON.stringify({ messages, locale: scenario.locale, projectContext: scenario.projectContext }),
  });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const body = await response.text();
  let answer = "";
  for (const event of body.split("\n\n")) {
    const data = event.split("\n").find((line) => line.startsWith("data: "));
    if (!data) continue;
    try {
      const payload = JSON.parse(data.slice(6));
      if (payload.type === "delta") answer += payload.text || "";
    } catch {
      // A malformed event is treated as absent; the empty-response check will catch it.
    }
  }
  return { answer, brain: response.headers.get("x-steinheim-brain") || "unknown" };
}

console.log(`Steinheim AI evaluation — ${selected.length} scenarios — ${baseUrl}`);
if (selected.length > RATE_MAX_REQUESTS && !force) {
  console.warn(
    `\nNote: this run fires ${selected.length} requests but the endpoint allows ${RATE_MAX_REQUESTS} per ${RATE_WINDOW_MS / 60000} minutes. ` +
      `Requests past that are skipped. Narrow the scope (--category/--id/--limit) or pass --force to proceed.\n`
  );
}
const results = [];
for (const [index, scenario] of selected.entries()) {
  try {
    const { answer, brain } = await ask(scenario);
    const result = checkScenario(scenario, answer);
    results.push({ scenario, ...result, answer, brain });
    const icon = result.passed ? "PASS" : "FAIL";
    console.log(`${String(index + 1).padStart(2, "0")}/${selected.length} ${icon}  ${scenario.id}  [${brain}]`);
    if (verbose && result.passed) console.log(`   ${answer.replace(/\s+/g, " ").slice(0, 500)}`);
    if (!result.passed) {
      console.log(`   ${result.failures.join("; ")}`);
      console.log(`   ${answer.replace(/\s+/g, " ").slice(0, 260)}`);
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      results.push({ scenario, passed: false, rateLimited: true, failures: [] });
      console.log(
        `${String(index + 1).padStart(2, "0")}/${selected.length} SKIP  ${scenario.id}  [rate limited — ${RATE_MAX_REQUESTS} req / ${RATE_WINDOW_MS / 60000} min]`
      );
      continue;
    }
    results.push({ scenario, passed: false, failures: [String(error)] });
    console.log(`${String(index + 1).padStart(2, "0")}/${selected.length} FAIL  ${scenario.id}  [request error]`);
    console.log(`   ${error}`);
  }
  if (index < selected.length - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
}

const passed = results.filter((result) => result.passed).length;
const rateLimited = results.filter((result) => result.rateLimited).length;
const evaluated = results.length - rateLimited;
console.log(`\nResult: ${passed}/${evaluated} passed (${Math.round((passed / Math.max(evaluated, 1)) * 100)}%)`);
if (rateLimited > 0) {
  console.log(`${rateLimited} skipped: endpoint rate limit (${RATE_MAX_REQUESTS} req / ${RATE_WINDOW_MS / 60000} min)`);
}
console.log("Default run covers critical scenarios. Use --all, --category hospitality, --limit 5, or --delay-ms 30000 to change scope.");
if (passed !== evaluated) process.exitCode = 1;
