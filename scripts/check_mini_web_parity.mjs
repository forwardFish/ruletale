import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredMiniPages = [
  "pages/hall/index",
  "pages/dungeon/index",
  "pages/archive/index",
  "pages/settlement/index",
];

const requiredBuilders = [
  "buildHallPresentation",
  "buildDungeonPresentation",
  "buildArchivePresentation",
  "buildSettlementPresentation",
];

const requiredTypes = [
  "HallPresentation",
  "DungeonPresentation",
  "ArchivePresentation",
  "SettlementPresentation",
];

const parityConsumers = [
  "apps/web/src/components/mvp/lobby/LobbyView.tsx",
  "apps/web/src/components/mvp/DungeonView.tsx",
  "apps/mini/src/pages/hall/index.tsx",
  "apps/mini/src/pages/dungeon/index.tsx",
  "apps/mini/src/pages/archive/index.tsx",
  "apps/mini/src/pages/settlement/index.tsx",
];

const errors = [];

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function gitChangedFiles() {
  try {
    const output = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.split(/\r?\n/).filter(Boolean).map((item) => item.replaceAll("\\", "/"));
  } catch {
    return [];
  }
}

const presentationSource = read("packages/game-core/src/presentation.ts");
for (const symbol of [...requiredBuilders, ...requiredTypes]) {
  assert(presentationSource.includes(symbol), `Missing presentation export contract: ${symbol}`);
}

const gameCoreIndex = read("packages/game-core/src/index.ts");
assert(gameCoreIndex.includes('export * from "./presentation";'), "packages/game-core/src/index.ts must export presentation.");

for (const relativePath of parityConsumers) {
  const source = read(relativePath);
  assert(source.includes("@game-core/presentation"), `${relativePath} must import shared @game-core/presentation.`);
}

const appJsonPath = path.join(repoRoot, "apps/mini/dist/app.json");
assert(existsSync(appJsonPath), "apps/mini/dist/app.json is missing. Run npm run build:weapp in apps/mini first.");
if (existsSync(appJsonPath)) {
  const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
  for (const page of requiredMiniPages) {
    assert(appJson.pages?.includes(page), `Mini dist/app.json is missing page ${page}.`);
  }
}

const changed = gitChangedFiles();
const webChanged = changed.some((file) => file.startsWith("apps/web/src/components/mvp/") || file.startsWith("apps/web/src/app/mvp/"));
const miniChanged = changed.some((file) => file.startsWith("apps/mini/src/"));
const presentationChanged = changed.some((file) => file === "packages/game-core/src/presentation.ts");
const explicitParityChanged = changed.some((file) => file === "scripts/check_mini_web_parity.mjs");

if ((webChanged || miniChanged) && !(webChanged && miniChanged) && !presentationChanged && !explicitParityChanged) {
  errors.push(
    "Only one UI target changed. Update both apps/web and apps/mini, or update packages/game-core/src/presentation.ts to explicitly carry the shared contract.",
  );
}

if (errors.length) {
  console.error("Mini/Web parity check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Mini/Web parity check passed.");
