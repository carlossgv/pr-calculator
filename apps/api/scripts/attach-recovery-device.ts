import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { DeviceAttachmentService } from "../src/recovery/device-attachment.service";
import { prisma } from "../src/prisma";

async function main() {
  const [deviceId, recoveryId] = process.argv.slice(2);
  if (!deviceId || !recoveryId) throw new Error("Usage: pnpm support:attach-device <device-id> <recovery-id>");

  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question(`Attach device ${deviceId} to ${recoveryId.toLowerCase()}? Type yes: `);
  prompt.close();
  if (answer !== "yes") throw new Error("Cancelled");

  const result = await new DeviceAttachmentService().supportAttach(deviceId, recoveryId);
  stdout.write(`Attached device to account ${result.accountId}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
