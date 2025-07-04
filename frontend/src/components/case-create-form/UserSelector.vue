<script setup lang="ts">
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Popover from 'primevue/popover'
import { computed, nextTick, ref } from 'vue'

export type User = { id: number; name: string; image: string }

const props = defineProps<{
  assigneeLabel: string
  placeholder?: string
  userOptions: User[]
  selectedUsers?: User[]
  multiSelect: boolean
  disabled?: boolean
  invalid?: boolean
}>()

// Group people by first letter of their name add Suggestions
const groupedUserOptions = computed(() => {
  type Group = { label: string; users: User[] }
  const suggestionGroup: Group = { label: 'Suggestions', users: [] }
  const groupedPeople: Group[] = [suggestionGroup]

  props.userOptions.forEach((user) => {
    // Add the current user to the 'Suggestions' group
    if (user.name.endsWith(' (You)')) {
      suggestionGroup.users.push(user)
    }

    const groupLabel = 'Users' // Group by some property, e.g. person.name[0].toUpperCase()
    const group = groupedPeople.find((group) => group.label === groupLabel)

    if (group) {
      group.users.push(user)
    } else {
      groupedPeople.push({ label: groupLabel, users: [user] })
    }
  })

  return groupedPeople
})

const emit = defineEmits<{ (e: 'update:selectedUsers', v: User[]): void }>()

const popover = ref()
const selectedPopoverUser = ref()
const togglePopover = (event: MouseEvent, value: User) => {
  popover.value.hide()

  if (selectedPopoverUser.value !== value) {
    selectedPopoverUser.value = value

    nextTick(() => {
      popover.value.show(event)
    })
  } else {
    selectedPopoverUser.value = null
  }
}

const hidePopover = () => {
  popover.value.hide()
}
</script>

<template>
  <component
    :is="multiSelect ? MultiSelect : Select"
    class="w-full"
    :disabled="props.disabled"
    id="{{ assigneeLabel.toLowerCase() }}"
    :options="groupedUserOptions"
    option-group-label="label"
    option-label="name"
    optionGroupChildren="users"
    :model-value="props.selectedUsers"
    @update:modelValue="emit('update:selectedUsers', $event)"
    :placeholder="placeholder ?? `Select ${assigneeLabel}`"
    display="chip"
    filter
    filter-placeholder="Search users"
    :invalid="props.invalid"
  >
    <template #option="slotProps">
      <div class="flex items-center w-full gap-x-3 pl-2">
        <img
          :alt="`Profile image of ${slotProps.option.name}`"
          :src="slotProps.option.image"
          class="rounded-full size-5 ring-offset-2 ring-1 ring-slate-600"
        />
        <p class="text-base flex-1">{{ slotProps.option.name }}</p>
        <Button
          @click.stop="togglePopover($event, slotProps.option)"
          type="button"
          severity="secondary"
          icon="pi pi-info-circle"
          rounded
        />
      </div>
    </template>

    <!-- @vue-ignore Only the MultiSelect component has the chip slot -->
    <template
      v-if="multiSelect"
      #chip="slotProps: { value: User; removeCallback: (e: Event) => void }"
    >
      <Chip removable :label="slotProps.value.name" @remove="slotProps.removeCallback($event)">
        <img
          :alt="`Profile image of ${slotProps.value.name}`"
          :src="slotProps.value.image"
          class="rounded-full size-5"
        />
        <p class="text-base">{{ slotProps.value.name }}</p>
      </Chip>
    </template>

    <template #dropdownicon>
      <i class="pi pi-user" />
    </template>

    <template #header>
      <div class="font-medium px-3 py-2">Available {{ assigneeLabel }}</div>
    </template>

    <template #footer>
      <div class="p-3 flex justify-between">
        <Button label="Add New" severity="secondary" text size="small" icon="pi pi-plus" />
        <Button
          label="Remove All"
          severity="danger"
          text
          size="small"
          icon="pi pi-times"
          @click="emit('update:selectedUsers', [])"
        />
      </div>
    </template>
  </component>

  <Popover ref="popover">
    <div class="flex flex-col gap-y-3 p-2">
      <h3 class="text-base font-semibold">{{ selectedPopoverUser?.name }}</h3>
      <p>Project Manager, Team D14</p>
      <Button severity="secondary" label="Close" @click.stop="hidePopover" />
    </div>
  </Popover>
</template>

<style scoped></style>
