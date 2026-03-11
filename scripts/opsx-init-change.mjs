#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

const [, , changeName, capabilityNameArg] = process.argv;
const capabilityName = capabilityNameArg ?? "new-capability";

if (!changeName) {
  console.error(
    "Usage: npm run opsx:init-change -- <change-name> [capability-name]",
  );
  process.exit(1);
}

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if (!kebabCasePattern.test(changeName)) {
  console.error(`Invalid change name: "${changeName}". Use kebab-case.`);
  process.exit(1);
}

if (!kebabCasePattern.test(capabilityName)) {
  console.error(
    `Invalid capability name: "${capabilityName}". Use kebab-case.`,
  );
  process.exit(1);
}

const openspecResult = spawnSync("openspec", ["new", "change", changeName], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (openspecResult.status !== 0) {
  process.exit(openspecResult.status ?? 1);
}

const templatesDir = resolve(repoRoot, "openspec", "templates");
const changeDir = resolve(repoRoot, "openspec", "changes", changeName);
const capabilityDir = resolve(changeDir, "specs", capabilityName);

const copies = [
  {
    from: resolve(templatesDir, "proposal.template.md"),
    to: resolve(changeDir, "proposal.md"),
  },
  {
    from: resolve(templatesDir, "design.template.md"),
    to: resolve(changeDir, "design.md"),
  },
  {
    from: resolve(templatesDir, "tasks.template.md"),
    to: resolve(changeDir, "tasks.md"),
  },
  {
    from: resolve(templatesDir, "spec.template.md"),
    to: resolve(capabilityDir, "spec.md"),
  },
];

for (const copyOp of copies) {
  if (!existsSync(copyOp.from)) {
    console.error(`Missing template file: ${copyOp.from}`);
    process.exit(1);
  }
}

mkdirSync(capabilityDir, { recursive: true });

for (const copyOp of copies) {
  if (existsSync(copyOp.to)) {
    console.error(`Refusing to overwrite existing file: ${copyOp.to}`);
    process.exit(1);
  }

  copyFileSync(copyOp.from, copyOp.to);
}

console.log("OpenSpec change initialized with starter templates:");
console.log(`- Change: ${changeName}`);
console.log(`- Capability: ${capabilityName}`);
console.log(`- Proposal: openspec/changes/${changeName}/proposal.md`);
console.log(`- Design: openspec/changes/${changeName}/design.md`);
console.log(`- Tasks: openspec/changes/${changeName}/tasks.md`);
console.log(
  `- Spec: openspec/changes/${changeName}/specs/${capabilityName}/spec.md`,
);
