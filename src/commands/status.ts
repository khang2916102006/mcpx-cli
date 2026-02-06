import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { CommandContext } from '../types/common.js';
import { ConfigStore } from '../core/config-store.js';
import { createRegistry } from '../providers/registry.js';
import { readTextFile, fileExists } from '../utils/fs.js';

export async function statusCommand(ctx: CommandContext): Promise<void> {
  const store = new ConfigStore(ctx.projectRoot);

  if (!store.exists()) {
    p.log.warn('Nenhum .mcpx.json encontrado neste diretorio.');
    p.log.info('Execute "mcpx init" para criar uma configuracao.');
    return;
  }

  const config = store.load();
  const registry = createRegistry();
  const serverCount = Object.keys(config.servers).length;

  let hasDesync = false;
  const lines: string[] = [];

  for (const providerName of config.providers) {
    const provider = registry.get(providerName);
    if (!provider) continue;

    const filePath = provider.getConfigFilePath(ctx.projectRoot);
    const expectedContent = provider.generate(config.servers);

    const displayPath = provider.config.supportsProjectConfig
      ? provider.config.configPath
      : provider.config.globalConfigPath ?? provider.config.configPath;

    let status: string;
    if (!fileExists(filePath)) {
      status = pc.red('ausente');
      hasDesync = true;
    } else {
      const currentContent = readTextFile(filePath);
      if (currentContent === expectedContent) {
        status = pc.green('sync');
      } else {
        status = pc.yellow('desync');
        hasDesync = true;
      }
    }

    lines.push(`${pc.bold(provider.config.displayName.padEnd(16))} ${displayPath.padEnd(30)} ${status}`);
  }

  p.note(
    lines.join('\n'),
    `${serverCount} servidor(es), ${config.providers.length} provider(s)`,
  );

  if (hasDesync) {
    p.log.warn('Alguns providers estao desatualizados. Execute "mcpx sync" para atualizar.');
  } else {
    p.log.success('Todos os providers estao sincronizados.');
  }
}
