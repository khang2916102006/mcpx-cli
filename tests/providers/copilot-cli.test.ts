import { describe, it, expect } from 'vitest';
import { CopilotCliProvider } from '../../src/providers/copilot-cli.js';
import type { McpServerConfig } from '../../src/types/canonical.js';

describe('CopilotCliProvider', () => {
  const provider = new CopilotCliProvider();

  it('deve gerar JSON com mcpServers sem campo type', () => {
    const servers: Record<string, McpServerConfig> = {
      github: {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@anthropic-ai/mcp-github-server'],
        env: { GITHUB_TOKEN: 'ghp_xxx' },
      },
    };

    const output = provider.generate(servers);
    const parsed = JSON.parse(output);

    expect(parsed.mcpServers.github).toEqual({
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-github-server'],
      env: { GITHUB_TOKEN: 'ghp_xxx' },
      tools: ['*'],
    });
  });

  it('deve fazer parse de JSON do Copilot CLI', () => {
    const input = JSON.stringify({
      mcpServers: {
        test: {
          command: 'docker',
          args: ['run', '-i', '--rm', 'ghcr.io/github/github-mcp-server'],
          env: { GITHUB_TOKEN: 'token' },
        },
      },
    });

    const result = provider.parse(input);

    expect(result['test']?.transport).toBe('stdio');
    expect(result['test']?.command).toBe('docker');
    expect(result['test']?.args).toContain('--rm');
  });

  it('deve incluir cwd quando definido', () => {
    const servers: Record<string, McpServerConfig> = {
      test: {
        transport: 'stdio',
        command: 'node',
        args: ['server.js'],
        cwd: '/path/to/project',
      },
    };

    const output = provider.generate(servers);
    const parsed = JSON.parse(output);

    expect(parsed.mcpServers.test.cwd).toBe('/path/to/project');
    expect(parsed.mcpServers.test.tools).toEqual(['*']);
  });

  it('deve ser provider de projeto', () => {
    expect(provider.config.supportsProjectConfig).toBe(true);
    expect(provider.config.configPath).toBe('.copilot/mcp-config.json');
  });
});
