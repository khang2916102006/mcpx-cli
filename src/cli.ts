import { Command } from 'commander';
import type { CommandContext } from './types/common.js';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { syncCommand } from './commands/sync.js';
import { importCommand } from './commands/import.js';
import { statusCommand } from './commands/status.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('mcpx')
    .description('CLI para configurar servidores MCP para multiplos providers de IA')
    .version('0.1.0')
    .option('-d, --dir <path>', 'Diretorio do projeto', process.cwd())
    .option('--verbose', 'Exibe logs detalhados', false);

  function getContext(): CommandContext {
    const opts = program.opts();
    return {
      projectRoot: opts['dir'] as string,
      verbose: opts['verbose'] as boolean,
    };
  }

  program
    .command('init')
    .description('Wizard interativo para configuracao inicial')
    .action(() => initCommand(getContext()));

  program
    .command('add')
    .description('Adiciona um servidor MCP')
    .argument('[name]', 'Nome do servidor')
    .action((name?: string) => addCommand(getContext(), name));

  program
    .command('remove')
    .description('Remove um servidor MCP')
    .argument('[name]', 'Nome do servidor')
    .action((name?: string) => removeCommand(getContext(), name));

  program
    .command('list')
    .description('Lista servidores MCP configurados')
    .action(() => listCommand(getContext()));

  program
    .command('sync')
    .description('Regenera arquivos de configuracao dos providers')
    .action(() => syncCommand(getContext()));

  program
    .command('import')
    .description('Importa configuracao de um provider existente')
    .argument('[provider]', 'Nome do provider')
    .action((provider?: string) => importCommand(getContext(), provider));

  program
    .command('status')
    .description('Mostra estado de sincronia dos providers')
    .action(() => statusCommand(getContext()));

  // Comando padrao: init
  program.action(() => initCommand(getContext()));

  return program;
}
