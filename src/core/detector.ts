import type { DetectionResult } from '../types/common.js';
import type { ProviderRegistry } from '../providers/registry.js';
import { readTextFile } from '../utils/fs.js';

export class ConfigDetector {
  constructor(
    private projectRoot: string,
    private registry: ProviderRegistry,
  ) {}

  detectAll(): DetectionResult[] {
    const results: DetectionResult[] = [];

    for (const provider of this.registry.getAll()) {
      // Ignora providers globais na detecção (não pertencem a nenhum projeto)
      if (!provider.config.supportsProjectConfig) continue;
      if (!provider.exists(this.projectRoot)) continue;

      try {
        const content = readTextFile(provider.getConfigFilePath(this.projectRoot));
        const servers = provider.parse(content);
        results.push({
          provider: provider.config.name,
          filePath: provider.getConfigFilePath(this.projectRoot),
          servers: Object.keys(servers),
        });
      } catch {
        // Arquivo existe mas nao pode ser parseado, ignora
      }
    }

    return results;
  }
}
