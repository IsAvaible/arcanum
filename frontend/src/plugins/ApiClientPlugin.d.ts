// TypeScript type augmentation for global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    $api: DefaultApi
  }
}
