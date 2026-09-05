import { readFileSync } from "node:fs";
import path from "node:path";
import { WorkflowSchema, findSecretLeaks } from "../schema.js";
import { listLocalWorkflowFiles } from "../util.js";

export async function validate(): Promise<void> {
  const files = listLocalWorkflowFiles();

  if (files.length === 0) {
    console.log("검증할 워크플로우 파일이 없습니다. 먼저 pull을 실행하세요.");
    return;
  }

  let hasError = false;

  for (const file of files) {
    const label = path.basename(file);
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    const parsed = WorkflowSchema.safeParse(raw);

    if (!parsed.success) {
      hasError = true;
      console.error(`✗ ${label}`);
      for (const issue of parsed.error.issues) {
        console.error(`    - ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }

    const leaks = findSecretLeaks(parsed.data);
    if (leaks.length > 0) {
      hasError = true;
      console.error(`✗ ${label}`);
      leaks.forEach((w) => console.error(`    - ${w}`));
      continue;
    }

    console.log(`✓ ${label}`);
  }

  if (hasError) {
    console.error("\n검증 실패: 위 항목을 수정한 뒤 다시 시도하세요.");
    process.exitCode = 1;
  } else {
    console.log("\n모든 워크플로우가 검증을 통과했습니다.");
  }
}
