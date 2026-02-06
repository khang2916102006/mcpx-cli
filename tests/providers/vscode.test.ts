import { describe, it, expect } from 'vitest';
import { VscodeProvider } from '../../src/providers/vscode.js';
import type { McpServerConfig } from '../../src/types/canonical.js';

describe('VscodeProvider', () => {
  const provider = new VscodeProvider();

  const servers: Record<string, McpServerConfig> = {
    'jira-tvx': {
      transport: 'stdio',
      command: 'uvx',
      args: ['mcp-atlassian'],
      env: { JIRA_URL: 'https://jira.example.com' },
    },
    'github-tvx': {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-github-server'],
      env: { GITHUB_TOKEN: 'ghp_xxx' },
    },
  };

  it('deve gerar JSON com root key servers e type stdio', () => {
    const output = provider.generate(servers);
    const parsed = JSON.parse(output);

    expect(parsed.servers['jira-tvx']).toEqual({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-atlassian'],
      env: { JIRA_URL: 'https://jira.example.com' },
    });

    expect(parsed.servers['github-tvx'].type).toBe('stdio');
  });

  it('deve ignorar servidores desabilitados', () => {
    const output = provider.generate({
      disabled: { transport: 'stdio', command: 'test', enabled: false },
      enabled: { transport: 'stdio', command: 'test' },
    });
    const parsed = JSON.parse(output);

    expect(parsed.servers['disabled']).toBeUndefined();
    expect(parsed.servers['enabled']).toBeDefined();
  });

  it('deve mapear http para type sse', () => {
    const httpServers: Record<string, McpServerConfig> = {
      remote: {
        transport: 'http',
        url: 'https://api.example.com/mcp',
        headers: { Authorization: 'Bearer token' },
      },
    };

    const output = provider.generate(httpServers);
    const parsed = JSON.parse(output);

    expect(parsed.servers['remote']).toEqual({
      type: 'sse',
      url: 'https://api.example.com/mcp',
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('deve fazer parse de JSON do VSCode com sse como http', () => {
    const input = JSON.stringify({
      servers: {
        test: {
          type: 'sse',
          url: 'https://mcp.example.com',
        },
      },
    });

    const result = provider.parse(input);

    expect(result['test']?.transport).toBe('http');
    expect(result['test']?.url).toBe('https://mcp.example.com');
  });

  it('deve gerar e parsear de volta com o mesmo resultado (roundtrip)', () => {
    const generated = provider.generate(servers);
    const parsed = provider.parse(generated);

    expect(parsed['jira-tvx']?.command).toBe('uvx');
    expect(parsed['jira-tvx']?.args).toEqual(['mcp-atlassian']);
    expect(parsed['jira-tvx']?.transport).toBe('stdio');
  });

  it('deve ser provider de projeto com configPath correto', () => {
    expect(provider.config.supportsProjectConfig).toBe(true);
    expect(provider.config.configPath).toBe('.vscode/mcp.json');
  });
});
