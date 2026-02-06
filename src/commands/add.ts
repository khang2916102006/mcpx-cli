import * as p from '@clack/prompts';
import type { CommandContext } from '../types/common.js';
import { ConfigStore } from '../core/config-store.js';
import { createRegistry } from '../providers/registry.js';
import { syncAllProviders } from '../core/merger.js';
import { runServerWizard } from '../wizard/server-wizard.js';

export async function addCommand(ctx: CommandContext, serverName?: string): Promise<void> {
  const store = new ConfigStore(ctx.projectRoot);

  if (!store.exists()) {
    p.log.warn('Nenhum .mcpx.json encontrado neste diretorio.');
    p.log.info('Execute "mcpx init" para criar uma configuracao.');
    return;
  }

  const config = store.load();
  const existingNames = Object.keys(config.servers);

  if (serverName && config.servers[serverName]) {
    p.log.warn(`Servidor "${serverName}" ja existe. Use outro nome.`);
    return;
  }

  const result = await runServerWizard(existingNames);
  if (!result) {
    p.cancel('Operacao cancelada.');
    return;
  }

  const updatedConfig = store.addServer(result.name, result.config);
  p.log.success(`Servidor "${result.name}" adicionado ao .mcpx.json`);

  const registry = createRegistry();
  const providers = registry.getByNames(updatedConfig.providers);
  const results = syncAllProviders(providers, ctx.projectRoot, updatedConfig.servers);

  for (const r of results) {
    if (r.status === 'error') {
      p.log.error(`${r.filePath}: ${r.error}`);
    } else if (r.status !== 'unchanged') {
      p.log.success(`Atualizado: ${r.filePath}`);
    }
  }
}
