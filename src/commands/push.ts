import { readFileSync, writeFileSync } from "node:fs";
import { createWorkflow, toUploadBody, updateWorkflow } from "../client.js";
import { WorkflowSchema, findSecretLeaks } from "../schema.js";
import { listLocalWorkflowFiles } from "../util.js";

export async function push(targetFile?: string): Promise<void> {
  const files = targetFile ? [targetFile] : listLocalWorkflowFiles();

  if (files.length === 0) {
    console.log("push할 워크플로우 파일이 없습니다. 먼저 pull을 실행하거나 workflows/ 에 JSON을 추가하세요.");
    return;
  }

  for (const file of files) {
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    const parsed = WorkflowSchema.safeParse(raw);

    if (!parsed.success) {
      console.error(`[스킵] ${file}: 스키마 검증 실패 — 먼저 'npm run validate'로 문제를 확인하세요.`);
      continue;
    }

    const leaks = findSecretLeaks(parsed.data);
    if (leaks.length > 0) {
      console.error(`[중단] ${file}: 시크릿 하드코딩 의심 항목이 있어 push를 거부합니다.`);
      leaks.forEach((w) => console.error(`  - ${w}`));
      continue;
    }

    const body = toUploadBody(raw);
    const id = typeof raw.id === "string" ? raw.id : undefined;

    if (id) {
      const updated = await updateWorkflow(id, body);
      writeFileSync(file, JSON.stringify(updated, null, 2), "utf-8");
      console.log(`업데이트됨: ${file} (id=${id})`);
    } else {
      const created = await createWorkflow(body);
      writeFileSync(file, JSON.stringify(created, null, 2), "utf-8");
      console.log(`생성됨: ${file} (id=${created.id})`);
    }
  }

  console.log("push 완료.");
}
