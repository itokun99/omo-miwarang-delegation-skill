import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const skillPath = resolve(root, "skills/miwarang-delegation/SKILL.md");
const readmePath = resolve(root, "README.md");
const licensePath = resolve(root, "LICENSE");
const displayConfigPath = resolve(root, "skills.sh.json");
const references = [
  "skills/miwarang-delegation/references/parameter-contract.md",
  "skills/miwarang-delegation/references/configuration.md",
  "skills/miwarang-delegation/references/lifecycle-and-troubleshooting.md",
];

function read(path) {
  return readFileSync(path, "utf8");
}

function fail(message) {
  throw new Error(message);
}

const skill = read(skillPath);
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
if (!frontmatter) fail("SKILL.md is missing YAML frontmatter");

const name = frontmatter[1].match(/^name:\s*([^\s]+)\s*$/m)?.[1];
const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1];
const version = frontmatter[1].match(/^\s+version:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];

if (name !== "miwarang-delegation") fail("skill name must match its directory");
if (!description?.includes("Use when")) fail("description must contain concrete triggers");
if (!version) fail("metadata.version is required");
if (version !== "0.2.1") fail(`expected skill version 0.2.1, got ${version}`);
if (skill.split("\n").length > 500) fail("SKILL.md must stay under 500 lines");
if (!read(readmePath).includes("npx skills add")) fail("README must document installation");
if (!read(licensePath).includes("MIT License")) fail("MIT LICENSE is required");
for (const reference of references) {
  if (!readFileSync(resolve(root, reference), "utf8").includes("Miwarang")) {
    fail(`${reference} is missing Miwarang guidance`);
  }
}
for (const token of ["miwarang_delegate", "miwarang_wait", "miwarang_cancel", "fallbacks"]) {
  if (!skill.includes(token)) fail(`SKILL.md is missing ${token}`);
}

const displayConfig = JSON.parse(read(displayConfigPath));
if (!Array.isArray(displayConfig.groupings) || displayConfig.groupings.length === 0) {
  fail("skills.sh.json must define at least one grouping");
}
if (!displayConfig.groupings.some((group) => group.skills.includes(name))) {
  fail("skills.sh.json must list the skill slug");
}

console.log("skill check: ok");
