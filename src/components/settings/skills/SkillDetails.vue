<script setup lang="ts">
import { useAIMessages, useCommonMessages } from '@open-pencil/vue'

import type { Skill } from '@/app/ai/skills/types'
import MarkdownContent from '@/components/markdown/MarkdownContent.vue'
import SettingsGroup from '@/components/settings/layout/SettingsGroup.vue'
import SettingsPage from '@/components/settings/layout/SettingsPage.vue'
import SettingsRow from '@/components/settings/layout/SettingsRow.vue'
import SettingsSection from '@/components/settings/layout/SettingsSection.vue'
import AppButton from '@/components/ui/button/AppButton.vue'
import AppAlert from '@/components/ui/feedback/AppAlert.vue'

const { skill, removable } = defineProps<{ skill: Skill; removable: boolean }>()

const emit = defineEmits<{ back: []; remove: [] }>()

const ai = useAIMessages()
const common = useCommonMessages()
</script>

<template>
  <SettingsPage data-test-id="settings-skill-details">
    <div class="flex flex-col gap-6">
      <SettingsSection>
        <template #title>{{ skill.name }}</template>
        <template #description>{{ skill.description }}</template>
        <SettingsGroup v-if="skill.source !== 'openpencil' || skill.files.length">
          <SettingsRow v-if="skill.source !== 'openpencil'" :label="ai.skillsLocation">
            <code class="text-xs break-all text-muted">{{ skill.location }}</code>
          </SettingsRow>
          <SettingsRow v-if="skill.files.length" :label="ai.skillsFiles">
            <template #description>
              <ul class="mt-1 flex flex-col gap-0.5">
                <li v-for="file in skill.files" :key="file">
                  <code class="text-xs break-all text-muted">{{ file }}</code>
                </li>
              </ul>
            </template>
          </SettingsRow>
        </SettingsGroup>
        <AppAlert v-if="skill.warnings.length" tone="warning" :heading="ai.skillsWarnings">
          <ul class="flex flex-col gap-0.5">
            <li v-for="warning in skill.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </AppAlert>
      </SettingsSection>
      <SettingsSection>
        <template #title>{{ ai.skillsInstructions }}</template>
        <div class="rounded border border-border px-4 py-3">
          <MarkdownContent :content="skill.instructions" />
        </div>
      </SettingsSection>
    </div>
    <template #footer>
      <AppButton
        v-if="removable"
        class="mr-auto"
        color="error"
        variant="link"
        @click="emit('remove')"
        >{{ ai.skillsDelete }}</AppButton
      >
      <AppButton @click="emit('back')">{{ common.back }}</AppButton>
    </template>
  </SettingsPage>
</template>
