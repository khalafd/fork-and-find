/**
 * gh-push.ts
 *
 * Pushes local changes to GitHub via the Git Data API.
 * On first run (no state file): pushes all git-tracked files.
 * On subsequent runs: pushes only files changed since the last push.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run gh-push
 *
 * Requires: GITHUB_TOKEN env var with `repo` + `workflow` scopes.
 *
 * State: .local/gh-push-state.json tracks the last pushed local HEAD SHA.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import https from "https";

// ─── Config ────────────────────────────────────────────────────────────────
const OWNER = "khalafd";
const REPO = "fork-and-find";
const BRANCH = "main";
const WORKSPACE = resolve(import.meta.dirname, "../..");
const STATE_FILE = resolve(WORKSPACE, ".local/gh-push-state.json");
// ───────────────────────────────────────────────────────────────────────────

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN env var is required (repo + workflow scopes).");
  process.exit(1);
}

// ─── GitHub API helper ──────────────────────────────────────────────────────
function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((res, rej) => {
    const payload = body ? JSON.stringify(body) : null;
    const options: https.RequestOptions = {
      hostname: "api.github.com",
      port: 443,
      path: `/repos/${OWNER}/${REPO}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "fork-and-find-gh-push",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (c: Buffer) => chunks.push(c));
      response.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const data = JSON.parse(raw) as Record<string, unknown>;
          if ((response.statusCode ?? 0) >= 400) {
            rej(
              new Error(
                `${method} ${path} => HTTP ${response.statusCode}: ${JSON.stringify(data).slice(0, 400)}`
              )
            );
          } else {
            res(data as T);
          }
        } catch {
          rej(new Error(`Parse error: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on("error", rej);
    if (payload) req.write(payload);
    req.end();
  });
}

function git(cmd: string): string {
  return execSync(`git -C ${WORKSPACE} ${cmd}`, { encoding: "utf8" }).trim();
}

// ─── Step 1: get local HEAD SHA ─────────────────────────────────────────────
const localHeadSha = git("rev-parse HEAD");
console.log(`Local HEAD:  ${localHeadSha}`);

// ─── Step 2: load push state ────────────────────────────────────────────────
type PushState = { lastLocalSha: string; lastRemoteSha: string };

let state: PushState | null = null;
if (existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as PushState;
    console.log(`Last pushed: ${state.lastLocalSha} → ${state.lastRemoteSha}`);
  } catch {
    console.warn("Could not read push state — will push all tracked files.");
  }
}

// ─── Step 3: determine changed files ────────────────────────────────────────
let changedFiles: string[];

if (state) {
  // Incremental: only files changed since last push
  const diff = git(`diff --name-only ${state.lastLocalSha} HEAD`);
  changedFiles = diff ? diff.split("\n").filter(Boolean) : [];
} else {
  // First run: push all tracked files
  const tracked = git("ls-files");
  changedFiles = tracked ? tracked.split("\n").filter(Boolean) : [];
}

if (changedFiles.length === 0) {
  console.log("\nNothing to push — remote is already up to date.");
  process.exit(0);
}

console.log(`\nFiles to push (${changedFiles.length}):`);
changedFiles.forEach((f) => console.log(`  ${f}`));

// ─── Step 4: get remote HEAD and base tree ──────────────────────────────────
type RefResponse = { object: { sha: string } };
type CommitResponse = { tree: { sha: string } };
type BlobResponse = { sha: string };
type TreeResponse = { sha: string };
type CommitCreatedResponse = { sha: string };

const refData = await apiRequest<RefResponse>(
  "GET",
  `/git/refs/heads/${BRANCH}`
);
const remoteHeadSha = refData.object.sha;
console.log(`\nRemote HEAD: ${remoteHeadSha}`);

const remoteCommit = await apiRequest<CommitResponse>(
  "GET",
  `/git/commits/${remoteHeadSha}`
);
const baseTreeSha = remoteCommit.tree.sha;
console.log(`Base tree:   ${baseTreeSha}`);

// ─── Step 5: create blobs ───────────────────────────────────────────────────
console.log("\nUploading blobs...");
const BINARY_RE = /\.(jpg|jpeg|png|gif|ico|woff|woff2|ttf|otf|eot)$/i;

type TreeEntry = { path: string; mode: string; type: string; sha: string };
const treeEntries: TreeEntry[] = [];

for (const file of changedFiles) {
  const fullPath = resolve(WORKSPACE, file);
  if (!existsSync(fullPath)) {
    console.log(`  [deleted] ${file} — skipping (deletions not auto-handled)`);
    continue;
  }
  const isBinary = BINARY_RE.test(file);
  process.stdout.write(`  ${file}... `);
  const content = isBinary
    ? readFileSync(fullPath).toString("base64")
    : readFileSync(fullPath, "utf8");
  const blob = await apiRequest<BlobResponse>("POST", "/git/blobs", {
    content,
    encoding: isBinary ? "base64" : "utf-8",
  });
  treeEntries.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
  console.log(blob.sha.slice(0, 8));
}

if (treeEntries.length === 0) {
  console.log("\nNo files to upload (all deleted). Exiting.");
  process.exit(0);
}

// ─── Step 6: create tree ────────────────────────────────────────────────────
console.log(`\nCreating tree (${treeEntries.length} entries)...`);
const tree = await apiRequest<TreeResponse>("POST", "/git/trees", {
  base_tree: baseTreeSha,
  tree: treeEntries,
});
console.log(`Tree: ${tree.sha}`);

// ─── Step 7: compose commit message ─────────────────────────────────────────
let commitMessage = "chore: sync local changes";
try {
  const fromSha = state?.lastLocalSha ?? remoteHeadSha;
  const log = git(`log --oneline ${fromSha}..HEAD`);
  if (log) commitMessage = log;
} catch {
  // fallback message is fine
}

// ─── Step 8: create commit ───────────────────────────────────────────────────
console.log("Creating commit...");
const commit = await apiRequest<CommitCreatedResponse>("POST", "/git/commits", {
  message: commitMessage,
  tree: tree.sha,
  parents: [remoteHeadSha],
});
console.log(`Commit: ${commit.sha}`);

// ─── Step 9: update branch ref ──────────────────────────────────────────────
console.log("Updating branch ref...");
await apiRequest("PATCH", `/git/refs/heads/${BRANCH}`, {
  sha: commit.sha,
  force: false,
});

// ─── Step 10: save state ────────────────────────────────────────────────────
mkdirSync(resolve(WORKSPACE, ".local"), { recursive: true });
const newState: PushState = {
  lastLocalSha: localHeadSha,
  lastRemoteSha: commit.sha,
};
writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

console.log(
  `\nDone! github.com/${OWNER}/${REPO}/commit/${commit.sha.slice(0, 8)}`
);
console.log(`State saved to .local/gh-push-state.json`);
