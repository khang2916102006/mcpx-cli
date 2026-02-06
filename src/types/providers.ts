import type { McpServerConfig, ProviderName } from './canonical.js';

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  configPath: string;
  supportsProjectConfig: boolean;
  globalConfigPath?: string;
}

export interface Provider {
  readonly config: ProviderConfig;
  generate(servers: Record<string, McpServerConfig>, existingContent?: string): string;
  parse(content: string): Record<string, McpServerConfig>;
  getConfigFilePath(projectRoot: string): string;
  exists(projectRoot: string): boolean;
}
