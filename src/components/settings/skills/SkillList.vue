<script setup lang="ts">
import { useAIMessages } from '@open-pencil/vue'

import type { SkillListEntry } from '@/app/ai/skills/settings/use'
import type { Skill } from '@/app/ai/skills/types'
import AppActionRow from '@/components/ui/list/AppActionRow.vue'
import AppSwitch from '@/components/ui/toggle/AppSwitch.vue'

const { entries, disabled } = defineProps<{ entries: SkillListEntry[]; disabled?: boolean }>()

const emit = defineEmits<{
  open: [skill: Skill]
  'set-enabled': [skill: Skill, enabled: boolean]
}>()

const ai = useAIMessages()
</script>

<template>
  <ul class="flex flex-col gap-1.5" data-slot="skill-list">
    <li
      v-for="entry in entries"
      :key="entry.skill.name"
      class="flex items-center gap-3"
      :data-shadowed="entry.shadowed || undefined"
    >
      <AppActionRow class="flex-1" @click="emit('open', entry.skill)">
        {{ entry.skill.name }}
        <template #description>
          <span class="line-clamp-2">{{ entry.skill.description }}</span>
          <span v-if="entry.shadowed" class="mt-0.5 block text-warning">{{
            ai.skillsShadowed
          }}</span>
        </template>
        <template #trailing><icon-lucide-chevron-right class="size-3.5" /></template>
      </AppActionRow>
      <AppSwitch
        :model-value="entry.enabled"
        :label="entry.skill.name"
        :disabled="disabled"
        @update:model-value="emit('set-enabled', entry.skill, $event)"
      />
    </li>
  </ul>
</template>
