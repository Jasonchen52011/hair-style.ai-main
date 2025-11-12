import { HairstyleProvider, ProviderConfig } from './types';
import { AilabApiProvider } from './ailabapi-provider';
import { JimengProvider } from './jimeng-provider';
import { KieNanoBananaProvider } from './kie-nanobanana-provider';

export * from './types';

export type ProviderType = 'ailabapi' | 'jimeng' | 'kie-nanobanana';

/**
 * Factory function to create the appropriate provider based on configuration
 */
export function createHairstyleProvider(
  type?: ProviderType,
  config?: ProviderConfig
): HairstyleProvider {
  // Get provider type from environment if not specified
  const providerType = type || (process.env.API_PROVIDER as ProviderType) || 'jimeng';
  
  console.log(`[Provider Factory] Creating provider: ${providerType}`);
  
  switch (providerType) {
    case 'ailabapi':
      return new AilabApiProvider(config || {});

    case 'kie-nanobanana':
      return new KieNanoBananaProvider(config || {});

    case 'jimeng':
    default:
      return new JimengProvider(config || {});
  }
}

/**
 * Get the current provider instance (singleton pattern)
 */
let currentProvider: HairstyleProvider | null = null;

export function getHairstyleProvider(): HairstyleProvider {
  if (!currentProvider) {
    currentProvider = createHairstyleProvider();
  }
  return currentProvider;
}

/**
 * Switch provider at runtime (useful for A/B testing)
 */
export function switchProvider(type: ProviderType, config?: ProviderConfig): void {
  currentProvider = createHairstyleProvider(type, config);
  console.log(`[Provider Factory] Switched to provider: ${type}`);
}