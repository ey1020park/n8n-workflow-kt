import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listWorkflows } from "../client.js";
import { WORKFLOWS_DIR, sanitizeFilename } from "../util.js";

export async function pull(): Promise<void> {
  mkdirSync(WORKFLOWS_DIR, { recursive: true });

  const workflows = await listWorkflows();
  console.log(`서버에서 워크플로우 ${workflows.length}개를 찾았습니다.`);

  for (const wf of workflows) {
    const id = String(wf.id);
    const name = sanitizeFilename(String(wf.name ?? id));
    const filePath = path.join(WORKFLOWS_DIR, `${id}-${name}.json`);
    writeFileSync(filePath, JSON.stringify(wf, null, 2), "utf-8");
    console.log(`  저장됨: ${path.relative(process.cwd(), filePath)}`);
  }

  console.log("pull 완료.");
}
