import { describe, it, expect } from 'vitest';
import { ClaudeCodeProvider } from '../../src/providers/claude-code.js';
import type { McpServerConfig } from '../../src/types/canonical.js';

describe('ClaudeCodeProvider', () => {
  const provider = new ClaudeCodeProvider();

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

  it('deve gerar JSON com mcpServers e type stdio', () => {
    const output = provider.generate(servers);
    const parsed = JSON.parse(output);

    expect(parsed.mcpServers['jira-tvx']).toEqual({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-atlassian'],
      env: { JIRA_URL: 'https://jira.example.com' },
    });

    expect(parsed.mcpServers['github-tvx'].type).toBe('stdio');
  });

  it('deve ignorar servidores desabilitados', () => {
    const output = provider.generate({
      disabled: { transport: 'stdio', command: 'test', enabled: false },
      enabled: { transport: 'stdio', command: 'test' },
    });
    const parsed = JSON.parse(output);

    expect(parsed.mcpServers['disabled']).toBeUndefined();
    expect(parsed.mcpServers['enabled']).toBeDefined();
  });

  it('deve fazer parse de JSON do Claude Code', () => {
    const input = JSON.stringify({
      mcpServers: {
        test: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', 'test-server'],
          env: { KEY: 'value' },
        },
      },
    });

    const result = provider.parse(input);

    expect(result['test']).toEqual({
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'test-server'],
      env: { KEY: 'value' },
    });
  });

  it('deve gerar e parsear de volta com o mesmo resultado (roundtrip)', () => {
    const generated = provider.generate(servers);
    const parsed = provider.parse(generated);

    expect(parsed['jira-tvx']?.command).toBe('uvx');
    expect(parsed['jira-tvx']?.args).toEqual(['mcp-atlassian']);
    expect(parsed['jira-tvx']?.transport).toBe('stdio');
  });

  it('deve suportar transporte http', () => {
    const httpServers: Record<string, McpServerConfig> = {
      remote: {
        transport: 'http',
        url: 'https://mcp.example.com/api',
        headers: { Authorization: 'Bearer token' },
      },
    };

    const output = provider.generate(httpServers);
    const parsed = JSON.parse(output);

    expect(parsed.mcpServers['remote']).toEqual({
      type: 'http',
      url: 'https://mcp.example.com/api',
      headers: { Authorization: 'Bearer token' },
    });
  });
});
