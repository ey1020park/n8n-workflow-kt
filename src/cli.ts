import { pull } from "./commands/pull.js";
import { push } from "./commands/push.js";
import { validate } from "./commands/validate.js";
import { creds } from "./commands/creds.js";

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "pull":
      await pull();
      break;
    case "push":
      await push(args[0]);
      break;
    case "validate":
      await validate();
      break;
    case "creds":
      await creds();
      break;
    default:
      console.log("사용법: tsx src/cli.ts <pull|push [file]|validate|creds>");
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
