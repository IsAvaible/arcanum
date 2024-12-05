import { type App } from 'vue'
import { Configuration, DefaultApi } from '@/api'

// Create a centralized configuration for your API client
const createApiConfig = () => {
  return new Configuration({
    basePath: import.meta.env.VITE_API_BASE_URL,
  })
}

// Create the API client with the configuration
const createApiClient = () => {
  const config = createApiConfig()
  return new DefaultApi(config)
}

// Vue plugin for API client
export const ApiClientPlugin = {
  install: (app: App) => {
    // Create a single instance of the API client
    const apiClient = createApiClient()

    // Provide the API client globally
    app.config.globalProperties.$api = apiClient

    // Optional: Provide via dependency injection for composition API
    app.provide('api', apiClient)
  },
}
