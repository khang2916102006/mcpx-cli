import { McpConfigFileSchema, type McpConfigFile } from '../types/canonical.js';

export function validateConfig(data: unknown): McpConfigFile {
  return McpConfigFileSchema.parse(data);
}

export function isValidServerName(name: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}
