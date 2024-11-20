<script setup lang="ts">
// Import necessary Vue composition API functions and PrimeVue components
import { ref } from 'vue'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'

// Define data type options
const dataTypes = [
  { label: 'Text', value: 'text' },
  { label: 'XML', value: 'xml' },
  { label: 'JSON', value: 'json' },
  { label: 'Image', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
]

// Reactive reference for the selected data type
const selectedDataType = ref('text')

// Function to get upload properties based on the selected data type
const getUploadProps = (dataType: string) => {
  switch (dataType) {
    case 'image':
      return {
        accept: 'image/*',
        maxFileSize: 1000000,
        chooseLabel: 'Choose Image',
      }
    case 'audio':
      return {
        accept: 'audio/*',
        maxFileSize: 1000000,
        chooseLabel: 'Choose Audio',
      }
    case 'video':
      return {
        accept: 'video/*',
        maxFileSize: 10000000,
        chooseLabel: 'Choose Video',
      }
    default:
      return {}
  }
}

// Function to handle file upload
const onUpload = (event: unknown) => {
  console.log('File uploaded:', event)
}
</script>

<template>
  <Card>
    <template #title>
      <!-- Card title -->
      <h2 class="text-xl font-semibold mb-4">Data</h2>
    </template>
    <template #content>
      <div class="space-y-6">
        <!-- Data type selection buttons -->
        <div class="flex justify-between items-center">
          <div v-for="dataType in dataTypes" :key="dataType.value" class="text-center">
            <button
              @click="selectedDataType = dataType.value"
              class="px-4 py-2 rounded-md transition-colors duration-200 ease-in-out"
              :class="{
                'bg-blue-100 text-blue-700': selectedDataType === dataType.value,
                'hover:bg-gray-100': selectedDataType !== dataType.value,
              }"
            >
              {{ dataType.label }}
            </button>
          </div>
        </div>

        <div class="mt-4">
          <!-- Text input for text-based data types -->
          <div v-if="['text', 'xml', 'json'].includes(selectedDataType)">
            <Textarea
              :placeholder="`Enter ${selectedDataType.toUpperCase()} data`"
              rows="4"
              class="w-full"
            />
          </div>
          <!-- File upload for non-text data types -->
          <div v-else class="flex justify-center">
            <FileUpload
              mode="basic"
              :auto="true"
              @upload="onUpload"
              v-bind="getUploadProps(selectedDataType)"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
