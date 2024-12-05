// Declare as module to augment global scope.
// See: https://vuejs.org/guide/typescript/options-api#type-augmentation-placement
export {}

// TypeScript type augmentation for global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    $api: DefaultApi
  }
}
