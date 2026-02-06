import type { CommandContext } from '../types/common.js';
import { runMainWizard } from '../wizard/main-wizard.js';

export async function initCommand(ctx: CommandContext): Promise<void> {
  await runMainWizard(ctx.projectRoot);
}
