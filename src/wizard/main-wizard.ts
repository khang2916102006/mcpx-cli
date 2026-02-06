import * as p from '@clack/prompts';
import type { McpServerConfig } from '../types/canonical.js';
import { ConfigStore } from '../core/config-store.js';
import { ConfigDetector } from '../core/detector.js';
import { createRegistry } from '../providers/registry.js';
import { syncAllProviders, cleanupRemovedProviders } from '../core/merger.js';
import { readTextFile, ensureShellAlias } from '../utils/fs.js';
import { runServerWizard } from './server-wizard.js';
import { runProviderWizard } from './provider-wizard.js';
import { handleCancel, BACK } from './step-runner.js';

export async function runMainWizard(projectRoot: string): Promise<void> {
  const store = new ConfigStore(projectRoot);
  const registry = createRegistry();

  p.intro('MCPX - Configuracao de servidores MCP');

  if (store.exists()) {
    await handleExistingConfig(store, registry, projectRoot);
    return;
  }

  await handleNewConfig(store, registry, projectRoot);
}

async function handleExistingConfig(
  store: ConfigStore,
  registry: ReturnType<typeof createRegistry>,
  projectRoot: string,
): Promise<void> {
  const config = store.load();
  const serverCount = Object.keys(config.servers).length;

  p.log.info(`Configuracao encontrada: ${serverCount} servidor(es), ${config.providers.length} provider(s)`);

  const action = handleCancel(
    await p.select({
      message: 'O que deseja fazer?',
      options: [
        { value: 'add', label: 'Adicionar servidor' },
        { value: 'remove', label: 'Remover servidor' },
        { value: 'providers', label: 'Alterar providers' },
        { value: 'sync', label: 'Sincronizar configs' },
        { value: 'exit', label: 'Sair' },
      ],
    }),
  );

  if (action === BACK) {
    p.outro('Ate mais!');
    return;
  }

  switch (action) {
    case 'add': {
      const existingNames = Object.keys(config.servers);
      const result = await runServerWizard(existingNames);
      if (!result) {
        p.cancel('Operacao cancelada.');
        break;
      }
      store.addServer(result.name, result.config);
      p.log.success(`Servidor "${result.name}" adicionado.`);

      const updatedConfig = store.load();
      const providers = registry.getByNames(updatedConfig.providers);
      const results = syncAllProviders(providers, projectRoot, updatedConfig.servers);
      printSyncResults(results);
      break;
    }
    case 'remove': {
      const names = Object.keys(config.servers);
      if (names.length === 0) {
        p.log.info('Nenhum servidor para remover.');
        break;
      }
      const toRemove = handleCancel(
        await p.select({
          message: 'Qual servidor remover?',
          options: names.map((n) => ({ value: n, label: n })),
        }),
      );
      if (toRemove === BACK) break;

      const doConfirm = handleCancel(
        await p.confirm({ message: `Confirma remover "${toRemove}"?`, initialValue: false }),
      );
      if (doConfirm === BACK || !doConfirm) break;

      store.removeServer(toRemove);
      p.log.success(`Servidor "${toRemove}" removido.`);

      const updatedConfig = store.load();
      const providers = registry.getByNames(updatedConfig.providers);
      const results = syncAllProviders(providers, projectRoot, updatedConfig.servers);
      printSyncResults(results);
      break;
    }
    case 'providers': {
      const newProviders = await runProviderWizard(config.providers);
      if (newProviders === BACK) break;

      const removedNames = config.providers.filter((p) => !newProviders.includes(p));
      const removedProviders = registry.getByNames(removedNames);

      store.setProviders(newProviders);
      p.log.success('Providers atualizados.');

      if (removedProviders.length > 0) {
        const cleanupResults = cleanupRemovedProviders(removedProviders, projectRoot);
        printSyncResults(cleanupResults);
      }

      const updatedConfig = store.load();
      const providers = registry.getByNames(updatedConfig.providers);
      const results = syncAllProviders(providers, projectRoot, updatedConfig.servers);
      printSyncResults(results);
      break;
    }
    case 'sync': {
      const providers = registry.getByNames(config.providers);
      const results = syncAllProviders(providers, projectRoot, config.servers);
      printSyncResults(results);
      break;
    }
    case 'exit':
      p.outro('Ate mais!');
      break;
  }
}

async function handleNewConfig(
  store: ConfigStore,
  registry: ReturnType<typeof createRegistry>,
  projectRoot: string,
): Promise<void> {
  const detector = new ConfigDetector(projectRoot, registry);
  const detections = detector.detectAll();

  let servers: Record<string, McpServerConfig> = {};

  if (detections.length > 0) {
    const lines = detections.map((det) => {
      const provider = registry.get(det.provider);
      return `${provider?.config.displayName ?? det.provider} - ${det.servers.length} servidor(es)`;
    });
    p.note(lines.join('\n'), 'Configuracoes MCP detectadas');

    const doImport = handleCancel(
      await p.confirm({ message: 'Deseja importar essas configuracoes?', initialValue: true }),
    );

    if (doImport === BACK) {
      p.cancel('Operacao cancelada.');
      return;
    }

    if (doImport) {
      for (const det of detections) {
        const provider = registry.get(det.provider);
        if (!provider) continue;
        try {
          const content = readTextFile(provider.getConfigFilePath(projectRoot));
          const parsed = provider.parse(content);
          servers = { ...servers, ...parsed };
        } catch {
          // ignora erros de parse
        }
      }
      p.log.success(`${Object.keys(servers).length} servidor(es) importado(s).`);
    }
  }

  if (Object.keys(servers).length === 0) {
    p.log.step('Vamos configurar seus servidores MCP.');

    let addMore = true;
    while (addMore) {
      const result = await runServerWizard(Object.keys(servers));
      if (!result) {
        if (Object.keys(servers).length === 0) {
          p.cancel('Operacao cancelada.');
          return;
        }
        break;
      }
      servers[result.name] = result.config;
      p.log.success(`Servidor "${result.name}" adicionado.`);

      const more = handleCancel(
        await p.confirm({ message: 'Adicionar outro servidor?', initialValue: false }),
      );
      if (more === BACK) break;
      addMore = more as boolean;
    }
  }

  const providers = await runProviderWizard();
  if (providers === BACK) {
    p.cancel('Operacao cancelada.');
    return;
  }

  if (providers.length === 0) {
    p.log.warn('Nenhum provider selecionado.');
  }

  const serverList = Object.keys(servers).join(', ');
  const providerList = providers.map((pn) => registry.get(pn)?.config.displayName ?? pn).join(', ') || 'nenhum';
  p.note(`Servidores: ${serverList}\nProviders: ${providerList}`, 'Resumo');

  const doConfirm = handleCancel(
    await p.confirm({ message: 'Confirmar e gerar arquivos?', initialValue: true }),
  );

  if (doConfirm === BACK || !doConfirm) {
    p.cancel('Operacao cancelada.');
    return;
  }

  store.save({ version: 1, providers, servers });
  p.log.success('Criado: .mcpx.json');

  if (providers.length > 0) {
    const providerInstances = registry.getByNames(providers);
    const results = syncAllProviders(providerInstances, projectRoot, servers);
    printSyncResults(results);
  }

  p.outro('Configuracao concluida!');
}

function printSyncResults(
  results: Array<{ provider: string; filePath: string; status: string; error?: string }>,
): void {
  for (const result of results) {
    switch (result.status) {
      case 'created':
        p.log.success(`Criado: ${result.filePath}`);
        break;
      case 'updated':
        p.log.success(`Atualizado: ${result.filePath}`);
        break;
      case 'deleted':
        p.log.warn(`Removido: ${result.filePath}`);
        break;
      case 'error':
        p.log.error(`${result.filePath}: ${result.error}`);
        break;
    }
  }

  if (results.some((r) => r.provider === 'copilot-cli' && r.status !== 'error')) {
    if (ensureShellAlias('copilot', 'copilot --additional-mcp-config @.copilot/mcp-config.json')) {
      p.log.success('Alias "copilot" configurado no shell (execute "source ~/.zshrc" ou reinicie o terminal).');
    }
  }
}
