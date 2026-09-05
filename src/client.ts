import { getConfig } from "./config.js";

type JsonRecord = Record<string, unknown>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getConfig();
  const res = await fetch(`${config.baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": config.apiKey,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`n8n API 요청 실패 (${res.status} ${path}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function listWorkflows(): Promise<JsonRecord[]> {
  const items: JsonRecord[] = [];
  let cursor: string | undefined;

  do {
    const query = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : "?limit=100";
    const page = await request<{ data: JsonRecord[]; nextCursor: string | null }>(
      `/workflows${query}`,
    );
    items.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return items;
}

export async function getWorkflow(id: string): Promise<JsonRecord> {
  return request<JsonRecord>(`/workflows/${id}`);
}

export async function createWorkflow(body: JsonRecord): Promise<JsonRecord> {
  return request<JsonRecord>("/workflows", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateWorkflow(id: string, body: JsonRecord): Promise<JsonRecord> {
  return request<JsonRecord>(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

const UPLOADABLE_FIELDS = ["name", "nodes", "connections", "settings", "staticData"] as const;

// n8n API는 생성/수정 시 id, active, tags, createdAt 등 읽기 전용 필드를 body에 허용하지 않는다.
export function toUploadBody(workflow: JsonRecord): JsonRecord {
  const body: JsonRecord = {};
  for (const field of UPLOADABLE_FIELDS) {
    if (field in workflow) body[field] = workflow[field];
  }
  if (!("settings" in body)) body.settings = {};
  return body;
}

export async function listCredentials(): Promise<JsonRecord[]> {
  // n8n API는 credential 값(secret)을 절대 반환하지 않고 메타데이터(id, name, type)만 반환한다.
  const items: JsonRecord[] = [];
  let cursor: string | undefined;

  do {
    const query = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : "?limit=100";
    const page = await request<{ data: JsonRecord[]; nextCursor: string | null }>(
      `/credentials${query}`,
    );
    items.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return items;
}
