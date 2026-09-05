import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listCredentials } from "../client.js";
import { listLocalWorkflowFiles } from "../util.js";

interface CredentialUsage {
  credentialId: string;
  credentialName: string;
  credentialType: string;
  workflowFile: string;
  workflowName: string;
  nodeName: string;
}

export async function creds(): Promise<void> {
  const serverCreds = await listCredentials();
  const serverCredById = new Map(serverCreds.map((c) => [String(c.id), c]));

  const usages: CredentialUsage[] = [];

  for (const file of listLocalWorkflowFiles()) {
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    const workflowName = String(raw.name ?? path.basename(file));
    const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];

    for (const node of nodes) {
      const credentials = node.credentials as Record<string, { id?: string; name?: string }> | undefined;
      if (!credentials) continue;

      for (const [credType, ref] of Object.entries(credentials)) {
        usages.push({
          credentialId: String(ref?.id ?? "unknown"),
          credentialName: String(ref?.name ?? "unknown"),
          credentialType: credType,
          workflowFile: path.basename(file),
          workflowName,
          nodeName: String(node.name ?? "unknown"),
        });
      }
    }
  }

  const usedCredIds = new Set(usages.map((u) => u.credentialId));
  const orphaned = usages.filter((u) => !serverCredById.has(u.credentialId));
  const unused = serverCreds.filter((c) => !usedCredIds.has(String(c.id)));

  const lines: string[] = [];
  lines.push("# Credential 참조 맵");
  lines.push("");
  lines.push("이 문서는 어떤 워크플로우/노드가 어떤 credential을 참조하는지 정리합니다.");
  lines.push("credential의 실제 값(시크릿)은 포함하지 않으며, n8n 서버의 credential 저장소에만 존재합니다.");
  lines.push("");
  lines.push("| Credential ID | Credential Name | Type | Workflow | Node |");
  lines.push("|---|---|---|---|---|");
  for (const u of usages) {
    lines.push(
      `| ${u.credentialId} | ${u.credentialName} | ${u.credentialType} | ${u.workflowName} | ${u.nodeName} |`,
    );
  }

  lines.push("");
  lines.push("## 경고");
  if (orphaned.length === 0 && unused.length === 0) {
    lines.push("- 없음");
  }
  for (const o of orphaned) {
    lines.push(
      `- ⚠ "${o.workflowName}" (${o.workflowFile})의 노드 "${o.nodeName}"가 참조하는 credential id "${o.credentialId}"가 서버에 존재하지 않습니다. (삭제되었거나 다른 인스턴스의 credential일 수 있음)`,
    );
  }
  for (const u of unused) {
    lines.push(`- ℹ credential "${u.name}" (id=${u.id})는 어떤 로컬 워크플로우에서도 사용되지 않습니다.`);
  }

  const outPath = path.resolve(process.cwd(), "credential-map.md");
  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");

  console.log(`credential-map.md 생성 완료 (참조 ${usages.length}건, 서버 credential ${serverCreds.length}개)`);
  if (orphaned.length > 0) console.warn(`  ⚠ orphaned 참조 ${orphaned.length}건`);
  if (unused.length > 0) console.log(`  ℹ 미사용 credential ${unused.length}개`);
}
