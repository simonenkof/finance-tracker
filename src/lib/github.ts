import { emptyFinanceData, type FinanceData } from "./types";
import { parseFinanceData } from "./schema";

const LIVE_PATH = "data/live.json";
const BACKUPS_DIR = "backups";

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_DATA_REPO;
  if (!token) {
    throw new GitHubError(
      "GITHUB_TOKEN is not set. Add it to .env.local.",
      "config",
    );
  }
  if (!repo) {
    throw new GitHubError(
      "GITHUB_DATA_REPO is not set. Add it to .env.local.",
      "config",
    );
  }
  return { token, repo };
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly kind: "config" | "network" | "auth" | "conflict" | "not_found" | "api",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

interface ContentsResponse {
  sha: string;
  content: string;
  encoding: string;
  path: string;
}

async function githubFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { token, repo } = getConfig();
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new GitHubError(
      "Network error while contacting GitHub.",
      "network",
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new GitHubError(
      "GitHub rejected the token (unauthorized). Check GITHUB_TOKEN permissions.",
      "auth",
      res.status,
    );
  }
  if (res.status === 409) {
    throw new GitHubError(
      "Conflict: file was updated elsewhere. Reload and try again.",
      "conflict",
      409,
    );
  }
  return res;
}

export async function getLiveData(): Promise<{
  data: FinanceData;
  sha: string | null;
}> {
  const res = await githubFetch(LIVE_PATH);
  if (res.status === 404) {
    return { data: emptyFinanceData(), sha: null };
  }
  if (!res.ok) {
    throw new GitHubError(
      `Failed to read live data (${res.status}).`,
      "api",
      res.status,
    );
  }
  const body = (await res.json()) as ContentsResponse;
  const decoded = Buffer.from(body.content, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as unknown;
  return { data: parseFinanceData(parsed), sha: body.sha };
}

export async function putLiveData(
  data: FinanceData,
  sha: string | null,
  message = "Update live finance data",
): Promise<string> {
  const content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString(
    "base64",
  );
  const res = await githubFetch(LIVE_PATH, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409 || text.includes("sha")) {
      throw new GitHubError(
        "Conflict: live.json changed. Reload and save again.",
        "conflict",
        res.status,
      );
    }
    throw new GitHubError(
      `Failed to save live data (${res.status}).`,
      "api",
      res.status,
    );
  }
  const body = (await res.json()) as { content: { sha: string } };
  return body.content.sha;
}

function backupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").replace("T", "T").slice(0, 19);
}

export async function createBackup(
  data: FinanceData,
): Promise<{ path: string }> {
  const name = `${backupTimestamp()}.json`;
  const path = `${BACKUPS_DIR}/${name}`;
  const content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString(
    "base64",
  );
  const res = await githubFetch(path, {
    method: "PUT",
    body: JSON.stringify({
      message: `Backup ${name}`,
      content,
    }),
  });
  if (!res.ok) {
    throw new GitHubError(
      `Failed to create backup (${res.status}).`,
      "api",
      res.status,
    );
  }
  return { path };
}

export async function listBackups(): Promise<
  { name: string; path: string; sha: string }[]
> {
  const res = await githubFetch(BACKUPS_DIR);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new GitHubError(
      `Failed to list backups (${res.status}).`,
      "api",
      res.status,
    );
  }
  const body = (await res.json()) as
    | { name: string; path: string; sha: string; type: string }[]
    | { message: string };
  if (!Array.isArray(body)) {
    return [];
  }
  return body
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => ({ name: f.name, path: f.path, sha: f.sha }))
    .sort((a, b) => b.name.localeCompare(a.name));
}

export async function getBackupContent(path: string): Promise<FinanceData> {
  const res = await githubFetch(path);
  if (res.status === 404) {
    throw new GitHubError("Backup not found.", "not_found", 404);
  }
  if (!res.ok) {
    throw new GitHubError(
      `Failed to read backup (${res.status}).`,
      "api",
      res.status,
    );
  }
  const body = (await res.json()) as ContentsResponse;
  const decoded = Buffer.from(body.content, "base64").toString("utf8");
  return parseFinanceData(JSON.parse(decoded) as unknown);
}

export async function restoreBackup(
  backupPath: string,
  currentSha: string | null,
): Promise<{ data: FinanceData; sha: string }> {
  const data = await getBackupContent(backupPath);
  const sha = await putLiveData(data, currentSha, `Restore from ${backupPath}`);
  return { data, sha };
}

export function toErrorPayload(err: unknown): {
  error: string;
  kind: string;
  status?: number;
} {
  if (err instanceof GitHubError) {
    return { error: err.message, kind: err.kind, status: err.status };
  }
  if (err instanceof Error) {
    return { error: err.message, kind: "api" };
  }
  return { error: "Unknown error", kind: "api" };
}
