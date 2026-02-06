import * as p from '@clack/prompts';
import type { CommandContext } from '../types/common.js';
import type { ProviderName } from '../types/canonical.js';
import { ConfigStore } from '../core/config-store.js';
import { ConfigDetector } from '../core/detector.js';
import { createRegistry } from '../providers/registry.js';
import { syncAllProviders } from '../core/merger.js';
import { readTextFile } from '../utils/fs.js';
import { handleCancel, BACK } from '../wizard/step-runner.js';

export async function importCommand(ctx: CommandContext, providerArg?: string): Promise<void> {
  const store = new ConfigStore(ctx.projectRoot);
  const registry = createRegistry();
  const detector = new ConfigDetector(ctx.projectRoot, registry);

  const detections = detector.detectAll();

  if (detections.length === 0) {
    p.log.info('Nenhuma configuracao MCP existente detectada neste diretorio.');
    return;
  }

  const lines = detections.map((det) => {
    const provider = registry.get(det.provider);
    return `${provider?.config.displayName ?? det.provider} (${det.filePath}) - ${det.servers.length} servidor(es)`;
  });
  p.note(lines.join('\n'), 'Configuracoes detectadas');

  let selectedProvider: string;

  if (providerArg) {
    selectedProvider = providerArg;
  } else {
    const result = handleCancel(
      await p.select({
        message: 'De qual provider importar?',
        options: detections.map((d) => {
          const provider = registry.get(d.provider);
          return {
            value: d.provider,
            label: provider?.config.displayName ?? d.provider,
            hint: `${d.servers.length} servidores`,
          };
        }),
      }),
    );
    if (result === BACK) return;
    selectedProvider = result;
  }

  const provider = registry.get(selectedProvider as ProviderName);
  if (!provider) {
    p.log.error(`Provider "${selectedProvider}" nao encontrado.`);
    return;
  }

  const content = readTextFile(provider.getConfigFilePath(ctx.projectRoot));
  const parsedServers = provider.parse(content);
  const serverNames = Object.keys(parsedServers);

  if (serverNames.length === 0) {
    p.log.info('Nenhum servidor encontrado nesse provider.');
    return;
  }

  const selectedServers = handleCancel(
    await p.multiselect({
      message: 'Quais servidores importar?',
      options: serverNames.map((name) => ({ value: name, label: name })),
      initialValues: serverNames,
    }),
  );

  if (selectedServers === BACK || selectedServers.length === 0) {
    p.log.info('Nenhum servidor selecionado.');
    return;
  }

  if (!store.exists()) {
    store.createEmpty();
  }

  const config = store.load();

  for (const name of selectedServers) {
    const server = parsedServers[name];
    if (server) {
      config.servers[name] = server;
    }
  }

  store.save(config);
  p.log.success(`${selectedServers.length} servidor(es) importado(s) para .mcpx.json`);

  if (config.providers.length > 0) {
    const doSync = handleCancel(
      await p.confirm({ message: 'Deseja sincronizar com os providers configurados agora?', initialValue: true }),
    );

    if (doSync && doSync !== BACK) {
      const providers = registry.getByNames(config.providers);
      const results = syncAllProviders(providers, ctx.projectRoot, config.servers);
      for (const result of results) {
        if (result.status === 'error') {
          p.log.error(`${result.filePath}: ${result.error}`);
        } else if (result.status !== 'unchanged') {
          p.log.success(`${result.status === 'created' ? 'Criado' : 'Atualizado'}: ${result.filePath}`);
        }
      }
    }
  }
}
