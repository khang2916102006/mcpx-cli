import * as p from '@clack/prompts';
import type { CommandContext } from '../types/common.js';
import { ConfigStore } from '../core/config-store.js';
import { createRegistry } from '../providers/registry.js';
import { syncAllProviders } from '../core/merger.js';
import { handleCancel, BACK } from '../wizard/step-runner.js';

export async function removeCommand(ctx: CommandContext, serverName?: string): Promise<void> {
  const store = new ConfigStore(ctx.projectRoot);

  if (!store.exists()) {
    p.log.warn('Nenhum .mcpx.json encontrado neste diretorio.');
    p.log.info('Execute "mcpx init" para criar uma configuracao.');
    return;
  }

  const config = store.load();
  const serverNames = Object.keys(config.servers);

  if (serverNames.length === 0) {
    p.log.info('Nenhum servidor MCP configurado.');
    return;
  }

  let name: string;

  if (serverName && config.servers[serverName]) {
    name = serverName;
  } else {
    const selected = handleCancel(
      await p.select({
        message: 'Qual servidor deseja remover?',
        options: serverNames.map((n) => ({ value: n, label: n })),
      }),
    );
    if (selected === BACK) return;
    name = selected;
  }

  const confirmed = handleCancel(
    await p.confirm({ message: `Confirma remover o servidor "${name}"?`, initialValue: false }),
  );
  if (confirmed === BACK || !confirmed) {
    p.cancel('Operacao cancelada.');
    return;
  }

  const updatedConfig = store.removeServer(name);
  p.log.success(`Servidor "${name}" removido.`);

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
