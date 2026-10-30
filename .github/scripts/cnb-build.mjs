import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, appendFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const API = "https://api.cnb.cool";

export function publishCnbMain(git, remote, sha) {
  try {
    git("push", remote, `${sha}:refs/heads/main`);
  } catch {
    throw new Error("Could not update CNB main. Check push permissions; if its history has diverged, merge the CNB main commits into GitHub first. No force push was attempted.");
  }
}

export async function buildOnCnb({ repo, sha, branch, token, request = fetch, wait = ms => sleep(ms), now = Date.now, timeoutMs = 20 * 60 * 1000, log = console.log }) {
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(repo)) throw new Error("Invalid CNB_REPOSITORY");
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid source commit SHA");
  if (!token) throw new Error("Missing GitHub Actions secret: CNB_TOKEN");
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.cnb.api+json",
    "Content-Type": "application/json",
  };
  async function call(path, body) {
    const response = await request(`${API}/${repo}/-/build/${path}`, {
      method: body ? "POST" : "GET",
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      // Extract only diagnostic fields, never dump headers or arbitrary response bodies.
      let detail = "";
      try {
        const error = await response.json();
        detail = [error.code, error.message, error.error_description]
          .filter(value => typeof value === "string" || typeof value === "number")
          .join("; ")
          .replaceAll(token, "[REDACTED]")
          .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .slice(0, 800);
      } catch { /* Non-JSON error pages do not contain trusted diagnostic fields. */ }
      const hint = response.status === 403
        ? " Check CNB_TOKEN's private repository scope, repo-cnb-trigger:rw permission, and the token owner's repository role."
        : "";
      throw new Error(`CNB ${body ? "trigger" : "status"} request failed: HTTP ${response.status}${detail ? ` (${detail})` : ""}.${hint}`);
    }
    return response.json();
  }

  // Never retry a trigger request: a timed-out request may already have started a build.
  const started = await call("start", { branch, sha, event: "api_trigger_build", title: `GitHub deployment ${sha}`, sync: "false" });
  if (started.success !== true || !/^cnb-[a-zA-Z0-9-]+$/.test(started.sn || "")) {
    throw new Error("CNB did not confirm a build was triggered");
  }
  log(`CNB build: https://cnb.cool/${repo}/-/build/logs/${started.sn}`);
  const deadline = now() + timeoutMs;
  let previous;
  while (now() < deadline) {
    const result = await call(`status/${started.sn}`);
    if (result.status !== previous) {
      log(`CNB build status: ${result.status}`);
      previous = result.status;
    }
    if (result.status === "success") return started.sn;
    if (!["pending", "running", "queued", "created", "waiting", "initializing"].includes(result.status)) {
      throw new Error(`CNB build did not succeed: ${result.status || "missing status"}`);
    }
    await wait(15_000);
  }
  throw new Error("Timed out waiting for CNB build; deployment stopped. Check the CNB build log before retrying.");
}

async function main() {
  const { CNB_REPOSITORY: repo, GITHUB_SHA: sha, CNB_TOKEN: token } = process.env;
  if (!token) throw new Error("Missing GitHub Actions secret: CNB_TOKEN");
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(repo || "")) throw new Error("Invalid CNB_REPOSITORY");
  if (!/^[a-f0-9]{40}$/.test(sha || "")) throw new Error("Invalid GITHUB_SHA");
  const branch = "main";
  const remote = `https://cnb.cool/${repo}.git`;
  const temp = mkdtempSync(join(tmpdir(), "attendance-cnb-"));
  const askpass = join(temp, "askpass.sh");
  // Credentials never appear in the remote URL, process arguments, or checked-in files.
  writeFileSync(askpass, '#!/bin/sh\ncase "$1" in\n  *Username*) printf "%s\\n" cnb ;;\n  *) printf "%s\\n" "$CNB_TOKEN" ;;\nesac\n', { mode: 0o700 });
  const git = (...args) => execFileSync("git", ["-c", "credential.helper=", ...args], {
    env: { ...process.env, GIT_ASKPASS: askpass, GIT_TERMINAL_PROMPT: "0" },
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 120_000,
  });
  try {
    // Fast-forward main only; Git rejects diverging history instead of discarding commits.
    publishCnbMain(git, remote, sha);
    const sn = await buildOnCnb({ repo, sha, branch, token });
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `CNB build succeeded: [${sn}](https://cnb.cool/${repo}/-/build/logs/${sn})\n\nImage: \`docker.cnb.cool/${repo.toLowerCase()}:${sha}\`\n`);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
