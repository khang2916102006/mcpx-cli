import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ConfigStore } from '../../src/core/config-store.js';

describe('ConfigStore', () => {
  let tmpDir: string;
  let store: ConfigStore;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcpx-test-'));
    store = new ConfigStore(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('deve retornar false quando nao existe config', () => {
    expect(store.exists()).toBe(false);
  });

  it('deve criar config vazia', () => {
    const config = store.createEmpty(['claude-code']);
    expect(config.version).toBe(1);
    expect(config.providers).toEqual(['claude-code']);
    expect(config.servers).toEqual({});
    expect(store.exists()).toBe(true);
  });

  it('deve adicionar e remover servidor', () => {
    store.createEmpty([]);

    store.addServer('test', {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'test-server'],
    });

    let config = store.load();
    expect(config.servers['test']?.command).toBe('npx');

    store.removeServer('test');
    config = store.load();
    expect(config.servers['test']).toBeUndefined();
  });

  it('deve atualizar providers', () => {
    store.createEmpty([]);
    store.setProviders(['claude-code', 'gemini-cli']);

    const config = store.load();
    expect(config.providers).toEqual(['claude-code', 'gemini-cli']);
  });

  it('deve lançar erro para config invalida', () => {
    const configPath = path.join(tmpDir, '.mcpx.json');
    fs.writeFileSync(configPath, JSON.stringify({ invalid: true }));

    expect(() => store.load()).toThrow();
  });
});
