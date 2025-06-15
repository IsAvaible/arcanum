import { DefaultApi } from '@/api'
import { inject } from 'vue'

/**
 * Composable hook to access the API client in Composition API components
 * @returns {DefaultApi} The configured API client instance
 * @throws {Error} If API client is not properly provided
 */
export function useApi(): DefaultApi {
  const apiClient = inject<DefaultApi>('api')

  if (!apiClient) {
    throw new Error(
      'API Client not found. ' +
        'Ensure you have registered the ApiClientPlugin in your main.ts/main.js',
    )
  }

  return apiClient
}
