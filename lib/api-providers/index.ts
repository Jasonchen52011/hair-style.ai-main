import { HairstyleProvider, ProviderConfig } from './types';
import { AilabApiProvider } from './ailabapi-provider';
import { JimengProvider } from './jimeng-provider';

export * from './types';

export type ProviderType = 'ailabapi' | 'jimeng';

/**
 * Factory function to create the appropriate provider based on configuration
 */
export function createHairstyleProvider(
  type?: ProviderType,
  config?: ProviderConfig
): HairstyleProvider {
  // Get provider type from environment if not specified
  const providerType = type || (process.env.API_PROVIDER as ProviderType) || 'ailabapi';
  
  console.log(`[Provider Factory] Creating provider: ${providerType}`);
  
  switch (providerType) {
    case 'jimeng':
      return new JimengProvider(config || {});
    
    case 'ailabapi':
    default:
      return new AilabApiProvider(config || {});
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