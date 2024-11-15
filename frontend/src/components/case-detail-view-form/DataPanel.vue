<script setup lang="ts">
import { ref } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'

const activeIndex = ref(0)
const textData = ref('')
const xmlData = ref('')
const jsonData = ref('')

const onUpload = (event: unknown) => {
  // Handle file upload logic here
  console.log('File uploaded:', event)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">Data</h2>
    <TabView v-model:activeIndex="activeIndex">
      <TabPanel header="Text">
        <textarea v-model="textData" class="w-full h-48 p-2 border rounded" />
      </TabPanel>
      <TabPanel header="XML">
        <textarea v-model="xmlData" class="w-full h-48 p-2 border rounded" />
      </TabPanel>
      <TabPanel header="JSON">
        <textarea v-model="jsonData" class="w-full h-48 p-2 border rounded" />
      </TabPanel>
      <TabPanel header="Image">
        <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" @upload="onUpload" />
      </TabPanel>
      <TabPanel header="Audio">
        <FileUpload mode="basic" accept="audio/*" :maxFileSize="1000000" @upload="onUpload" />
      </TabPanel>
      <TabPanel header="Video">
        <FileUpload mode="basic" accept="video/*" :maxFileSize="10000000" @upload="onUpload" />
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
:deep(.p-tabview-nav) {
  border-bottom: 1px solid #e2e8f0;
}

:deep(.p-tabview-nav-link) {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  margin-right: 0.25rem;
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
}

:deep(.p-tabview-selected .p-tabview-nav-link) {
  background-color: #fff;
  border-bottom: 1px solid #fff;
}

:deep(.p-editor-container) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

:deep(.p-fileupload-buttonbar) {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 1rem;
}
</style>
