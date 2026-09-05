import { readdirSync } from "node:fs";
import path from "node:path";

export const WORKFLOWS_DIR = path.resolve(process.cwd(), "workflows");

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function listLocalWorkflowFiles(): string[] {
  try {
    return readdirSync(WORKFLOWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(WORKFLOWS_DIR, f));
  } catch {
    return [];
  }
}
