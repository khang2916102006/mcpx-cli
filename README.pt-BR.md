# MCPX

> **Uma config para dominar todas.** Configure seus servidores MCP uma vez e distribua para todas as CLIs de IA automaticamente.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## O Problema

Cada CLI de IA usa um **formato de arquivo diferente** para configurar servidores MCP (Model Context Protocol):

| CLI de IA | Arquivo de Config | Formato |
|-----------|------------------|---------|
| Claude Code | `.mcp.json` | JSON |
| Gemini CLI | `.gemini/settings.json` | JSON |
| Kimi CLI | `~/.kimi/mcp.json` | JSON |
| OpenAI Codex | `.codex/config.toml` | **TOML** |
| OpenCode | `opencode.json` | JSON |
| GitHub Copilot CLI | `.copilot/mcp-config.json` | JSON |

Se voce usa multiplas ferramentas de IA (e provavelmente usa), precisa **manter manualmente 6 arquivos de config diferentes** com estruturas, nomes de campos e particularidades distintas. Para **cada projeto**.

---

## A Solucao

O **MCPX** mantem um unico arquivo canonico (`.mcpx.json`) por projeto e **gera automaticamente** o arquivo de config correto para cada provider de IA que voce usa.

```
.mcpx.json  ──────►  .mcp.json                (Claude Code)
    │       ──────►  .gemini/settings.json     (Gemini CLI)
    │       ──────►  ~/.kimi/mcp.json          (Kimi CLI)
    │       ──────►  .codex/config.toml        (OpenAI Codex)
    │       ──────►  opencode.json             (OpenCode)
    └─────  ──────►  .copilot/mcp-config.json  (Copilot CLI)
```

---

## Inicio Rapido

### Instalacao

```bash
npm install -g mcpx
```

### Primeira Configuracao

Navegue ate o diretorio do seu projeto e execute:

```bash
mcpx
```

O wizard interativo vai te guiar por:

1. **Deteccao** — Detecta automaticamente configs MCP existentes no seu projeto
2. **Importacao** — Oferece importar servidores das configs detectadas
3. **Adicionar servidores** — Wizard interativo para configurar novos servidores MCP
4. **Selecionar providers** — Escolha para quais CLIs de IA gerar configs
5. **Gerar** — Cria o `.mcpx.json` e todos os arquivos dos providers

---

## Comandos

| Comando | Descricao |
|---------|-----------|
| `mcpx` ou `mcpx init` | Wizard interativo de configuracao |
| `mcpx add [nome]` | Adicionar um novo servidor MCP |
| `mcpx remove [nome]` | Remover um servidor MCP |
| `mcpx list` | Listar servidores MCP configurados |
| `mcpx sync` | Regenerar todos os arquivos de config dos providers |
| `mcpx import [provider]` | Importar config de um provider existente |
| `mcpx status` | Mostrar estado de sincronizacao dos providers |

### Flags Globais

| Flag | Descricao |
|------|-----------|
| `--dir, -d <caminho>` | Diretorio do projeto (padrao: diretorio atual) |
| `--verbose` | Exibir logs detalhados |
| `--version, -V` | Exibir versao |
| `--help, -h` | Exibir ajuda |

---

## Formato Canonico

O MCPX usa um unico arquivo `.mcpx.json` como fonte da verdade:

```json
{
  "version": 1,
  "providers": ["claude-code", "gemini-cli", "openai-codex", "copilot-cli"],
  "servers": {
    "jira": {
      "description": "Jira Atlassian",
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://minhaorg.atlassian.net",
        "JIRA_USERNAME": "usuario@exemplo.com",
        "JIRA_API_TOKEN": "seu-token"
      }
    },
    "github": {
      "description": "GitHub MCP Server",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-github-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

### Campos do Servidor

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `transport` | `"stdio"` \| `"http"` | Sim | Protocolo de transporte |
| `command` | `string` | stdio | Comando executavel |
| `args` | `string[]` | — | Argumentos do comando |
| `env` | `Record<string, string>` | — | Variaveis de ambiente |
| `cwd` | `string` | — | Diretorio de trabalho |
| `url` | `string` | http | URL do servidor |
| `headers` | `Record<string, string>` | — | Headers HTTP |
| `description` | `string` | — | Descricao legivel |
| `enabled` | `boolean` | — | Ativar/desativar (padrao: `true`) |

---

## Providers Suportados

### Providers com Escopo de Projeto

Estes providers geram arquivos de config **dentro do diretorio do projeto**. Cada projeto tem sua propria config independente.

#### Claude Code

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `.mcp.json` |
| **Formato** | JSON |
| **Chave raiz** | `mcpServers` |
| **Exige `type`** | Sim `"stdio"` |

#### Gemini CLI

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `.gemini/settings.json` |
| **Formato** | JSON |
| **Chave raiz** | `mcpServers` |
| **Exige `type`** | Nao |

#### OpenAI Codex

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `.codex/config.toml` |
| **Formato** | **TOML** |
| **Chave raiz** | `mcp_servers` |
| **Merge inteligente** | Sim — Preserva configuracoes existentes do Codex (`model`, `approval_mode`, etc.) |

#### OpenCode

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `opencode.json` |
| **Formato** | JSON |
| **Chave raiz** | `mcp` |
| **Particularidades** | `command` e um array (comando + args juntos), usa `environment` em vez de `env`, `type: "local"` |

#### GitHub Copilot CLI

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `.copilot/mcp-config.json` |
| **Formato** | JSON |
| **Chave raiz** | `mcpServers` |
| **Particularidades** | Exige campo `tools: ["*"]`, precisa de alias no shell para config por projeto |

> **Nota:** O Copilot CLI nao detecta automaticamente configs MCP a nivel de projeto. O MCPX configura automaticamente um alias no shell (`copilot='copilot --additional-mcp-config @.copilot/mcp-config.json'`) no seu `.zshrc`, `.bashrc` ou `config.fish` para que a config do projeto seja carregada ao executar `copilot`.

### Providers Globais

Estes providers usam um **unico arquivo global** compartilhado entre todos os projetos. Executar `mcpx sync` sobrescreve o arquivo global com os servidores do projeto atual.

#### Kimi CLI

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `~/.kimi/mcp.json` |
| **Formato** | JSON |
| **Chave raiz** | `mcpServers` |
| **Escopo** | Global — afeta todos os projetos |

---

## Sincronizacao e Gerenciamento de Providers

### Sincronizando

Apos modificar o `.mcpx.json` (manualmente ou via comandos), regenere todas as configs dos providers:

```bash
mcpx sync
```

### Alterando Providers

Use o wizard interativo para adicionar ou remover providers:

```bash
mcpx init
# Selecione "Alterar providers"
```

Quando um provider e **removido**, o MCPX **exclui** o arquivo de config correspondente. Para providers globais, arquivos legados a nivel de projeto tambem sao limpos.

### Importando de Configs Existentes

Ja tem servidores MCP configurados em uma das suas ferramentas de IA? Importe-os:

```bash
mcpx import
```

O MCPX detecta configs existentes a nivel de projeto (`.mcp.json`, `.gemini/settings.json`, etc.) e permite selecionar quais servidores importar para o `.mcpx.json`.

---

## Arquitetura

```
src/
├── cli.ts                    # Setup Commander e roteamento
├── types/
│   ├── canonical.ts          # McpConfigFile, McpServerConfig (schemas Zod)
│   ├── providers.ts          # Interface Provider
│   └── common.ts             # CommandContext, SyncResult
├── commands/
│   ├── init.ts               # Wizard interativo
│   ├── add.ts / remove.ts    # Gerenciamento de servidores
│   ├── list.ts / status.ts   # Exibicao de informacoes
│   ├── sync.ts               # Regenerar configs
│   └── import.ts             # Importar de providers
├── providers/
│   ├── base.ts               # Interface Provider
│   ├── registry.ts           # Registry de providers (factory)
│   ├── claude-code.ts        # .mcp.json
│   ├── gemini-cli.ts         # .gemini/settings.json
│   ├── kimi-cli.ts           # ~/.kimi/mcp.json
│   ├── openai-codex.ts       # .codex/config.toml
│   ├── opencode.ts           # opencode.json
│   └── copilot-cli.ts        # .copilot/mcp-config.json
├── core/
│   ├── config-store.ts       # Leitura/escrita do .mcpx.json
│   ├── detector.ts           # Deteccao de configs existentes
│   └── merger.ts             # Sync inteligente com suporte a merge
├── wizard/
│   ├── main-wizard.ts        # Fluxo interativo principal
│   ├── server-wizard.ts      # Wizard de criacao de servidor
│   ├── provider-wizard.ts    # Selecao de providers
│   └── step-runner.ts        # Navegacao entre etapas (suporte a voltar)
└── utils/
    ├── fs.ts                 # Helpers de filesystem
    ├── logger.ts             # Logger com cores
    └── validation.ts         # Validacao Zod
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Rodar uma vez (CI)
npm run test:run

# Checagem de tipos
npm run typecheck
```

---

## Stack Tecnica

| Categoria | Biblioteca |
|-----------|-----------|
| Linguagem | TypeScript 5.x (ESM) |
| Build | tsup (esbuild) |
| CLI Framework | commander |
| Prompts Interativos | @clack/prompts |
| Cores | picocolors |
| TOML | smol-toml |
| Validacao | zod |
| Testes | vitest |
| Node minimo | >= 20 |

---

## Licenca

MIT

---

<p align="center">
  <i><a href="./README.md">Read in English (en-US)</a></i>
</p>
