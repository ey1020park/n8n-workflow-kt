import { z } from "zod";

// n8n 워크플로우 JSON의 핵심 구조만 검증한다 (노드 파라미터 세부 스펙은 노드 타입마다 달라 검증 범위 밖).
export const WorkflowSchema = z.object({
  name: z.string().min(1, "워크플로우 이름이 비어 있습니다"),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        parameters: z.record(z.unknown()).default({}),
        credentials: z.record(z.unknown()).optional(),
      }),
    )
    .min(1, "노드가 하나도 없습니다"),
  connections: z.record(z.unknown()),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

const SECRET_LIKE_KEYS = ["password", "apikey", "api_key", "secret", "token", "accesskey"];

/**
 * credential 참조가 {id, name}이 아닌 실제 값(data)을 담고 있는지,
 * 혹은 parameters에 시크릿으로 보이는 값이 하드코딩되어 있는지 점검한다.
 */
export function findSecretLeaks(workflow: Workflow): string[] {
  const warnings: string[] = [];

  for (const node of workflow.nodes) {
    if (node.credentials) {
      for (const [credType, ref] of Object.entries(node.credentials)) {
        if (typeof ref !== "object" || ref === null) continue;
        const keys = Object.keys(ref as Record<string, unknown>);
        const extraKeys = keys.filter((k) => k !== "id" && k !== "name");
        if (extraKeys.length > 0) {
          warnings.push(
            `노드 "${node.name}" credential "${credType}"에 id/name 외 필드(${extraKeys.join(", ")})가 포함되어 있습니다 — 실제 credential 값이 export되었을 수 있습니다.`,
          );
        }
      }
    }

    warnings.push(...scanParametersForSecrets(node.name, node.parameters));
  }

  return warnings;
}

function scanParametersForSecrets(nodeName: string, obj: unknown, path = ""): string[] {
  const warnings: string[] = [];
  if (obj === null || typeof obj !== "object") return warnings;

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === "string") {
      const isExpression = value.startsWith("={{"); // n8n 표현식은 값을 하드코딩한 게 아니므로 제외
      const looksLikeSecretKey = SECRET_LIKE_KEYS.some((k) => key.toLowerCase().includes(k));
      if (looksLikeSecretKey && value.length > 0 && !isExpression) {
        warnings.push(
          `노드 "${nodeName}"의 "${currentPath}"에 값이 하드코딩되어 있습니다 — credential이나 환경변수 참조로 교체하세요.`,
        );
      }
    } else if (typeof value === "object") {
      warnings.push(...scanParametersForSecrets(nodeName, value, currentPath));
    }
  }

  return warnings;
}
