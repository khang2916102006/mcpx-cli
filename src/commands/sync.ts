import * as p from '@clack/prompts';
import type { CommandContext } from '../types/common.js';
import { ConfigStore } from '../core/config-store.js';
import { createRegistry } from '../providers/registry.js';
import { syncAllProviders } from '../core/merger.js';
import { ensureShellAlias } from '../utils/fs.js';

export async function syncCommand(ctx: CommandContext): Promise<void> {
  const store = new ConfigStore(ctx.projectRoot);

  if (!store.exists()) {
    p.log.warn('Nenhum .mcpx.json encontrado neste diretorio.');
    p.log.info('Execute "mcpx init" para criar uma configuracao.');
    return;
  }

  const config = store.load();
  const registry = createRegistry();
  const providers = registry.getByNames(config.providers);

  if (providers.length === 0) {
    p.log.warn('Nenhum provider configurado.');
    return;
  }

  const sp = p.spinner();
  sp.start('Sincronizando configuracoes...');

  const results = syncAllProviders(providers, ctx.projectRoot, config.servers);

  sp.stop('Sincronizacao concluida.');

  let updated = 0;
  let created = 0;
  let unchanged = 0;
  let deleted = 0;
  let errors = 0;

  for (const result of results) {
    switch (result.status) {
      case 'created':
        p.log.success(`${result.filePath} (criado)`);
        created++;
        break;
      case 'updated':
        p.log.success(`${result.filePath} (atualizado)`);
        updated++;
        break;
      case 'unchanged':
        p.log.step(`${result.filePath} (sem alteracoes)`);
        unchanged++;
        break;
      case 'deleted':
        p.log.warn(`${result.filePath} (removido)`);
        deleted++;
        break;
      case 'error':
        p.log.error(`${result.filePath}: ${result.error}`);
        errors++;
        break;
    }
  }

  const parts: string[] = [];
  if (created > 0) parts.push(`${created} criado(s)`);
  if (updated > 0) parts.push(`${updated} atualizado(s)`);
  if (deleted > 0) parts.push(`${deleted} removido(s)`);
  if (unchanged > 0) parts.push(`${unchanged} sem alteracoes`);
  if (errors > 0) parts.push(`${errors} erro(s)`);

  p.log.info(`${results.length} providers processados (${parts.join(', ')})`);

  if (config.providers.includes('copilot-cli')) {
    if (ensureShellAlias('copilot', 'copilot --additional-mcp-config @.copilot/mcp-config.json')) {
      p.log.success('Alias "copilot" configurado no shell (execute "source ~/.zshrc" ou reinicie o terminal).');
    }
  }
}
