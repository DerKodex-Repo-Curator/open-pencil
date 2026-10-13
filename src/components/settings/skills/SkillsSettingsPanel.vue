<script setup lang="ts">
import { useFileDialog } from '@vueuse/core'
import { AlertDialogAction, AlertDialogCancel } from 'reka-ui'
import { computed, ref } from 'vue'

import { useAIMessages, useCommonMessages } from '@open-pencil/vue'

import { useSkillsSettings, type SkillSourceGroup } from '@/app/ai/skills/settings/use'
import type { SkillUploadFailure } from '@/app/ai/skills/sources/uploaded'
import SettingsPage from '@/components/settings/layout/SettingsPage.vue'
import SettingsSection from '@/components/settings/layout/SettingsSection.vue'
import AppButton from '@/components/ui/button/AppButton.vue'
import { AppAlertDialogRoot, AppDialogFooter, AppDialogHeader } from '@/components/ui/dialog'
import AppAlert from '@/components/ui/feedback/AppAlert.vue'
import AppPlaceholder from '@/components/ui/feedback/AppPlaceholder.vue'
import AppSwitch from '@/components/ui/toggle/AppSwitch.vue'

import SkillDetails from './SkillDetails.vue'
import SkillList from './SkillList.vue'

const ai = useAIMessages()
const common = useCommonMessages()
const skills = useSkillsSettings()
const { groups, readsFolders, loading, uploading, uploadFailure, selected } = skills
const deleteOpen = ref(false)

const fileDialog = useFileDialog({
  accept: '.zip,.md,application/zip,text/markdown',
  multiple: false,
  reset: true
})
fileDialog.onChange((files) => {
  const file = files?.[0]
  if (file) void skills.upload(file)
})

function sourceTitle(group: SkillSourceGroup): string {
  if (group.source === 'agents') return ai.value.skillsAgentsSource
  if (group.source === 'claude') return ai.value.skillsClaudeSource
  return ai.value.skillsUploadedSource
}

function sourceDescription(group: SkillSourceGroup): string {
  const folder = group.folder ?? ''
  if (group.source === 'agents') return ai.value.skillsAgentsSourceDescription({ folder })
  if (group.source === 'claude') return ai.value.skillsClaudeSourceDescription({ folder })
  return ai.value.skillsUploadedSourceDescription
}

function failureText(failure: SkillUploadFailure): string {
  switch (failure.reason) {
    case 'too-large':
      return ai.value.skillsUploadTooLarge
    case 'no-skill':
      return ai.value.skillsUploadNoSkill
    case 'several-skills':
      return ai.value.skillsUploadSeveral
    case 'unreadable':
      return ai.value.skillsUploadUnreadable
    case 'invalid':
      return `${ai.value.skillsUploadInvalid} ${failure.detail}`
  }
}

const deleteDescription = computed(() =>
  ai.value.skillsDeleteDescription({ name: selected.value?.name ?? '' })
)

async function remove() {
  if (selected.value) await skills.remove(selected.value)
  deleteOpen.value = false
}
</script>

<template>
  <SkillDetails
    v-if="selected"
    :skill="selected"
    :removable="selected.source === 'openpencil'"
    @back="skills.close"
    @remove="deleteOpen = true"
  />
  <SettingsPage v-else data-test-id="settings-skills-panel">
    <div class="flex flex-col gap-6" :aria-busy="loading">
      <div class="flex items-start gap-4">
        <p class="min-w-0 flex-1 text-xs leading-relaxed text-muted">
          {{ ai.skillsDescription }}
        </p>
        <AppButton
          v-if="readsFolders"
          size="xs"
          variant="outline"
          :loading="loading"
          @click="skills.reload"
        >
          <template #leading><icon-lucide-refresh-cw class="size-3.5" /></template>
          {{ common.refresh }}
        </AppButton>
      </div>
      <SettingsSection
        v-for="group in groups"
        :key="group.source"
        :data-skill-source="group.source"
      >
        <template #title>{{ sourceTitle(group) }}</template>
        <template #description>{{ sourceDescription(group) }}</template>
        <template #actions>
          <AppButton
            v-if="group.source === 'openpencil'"
            variant="outline"
            :loading="uploading"
            @click="fileDialog.open()"
          >
            <template #leading><icon-lucide-upload class="size-3.5" /></template>
            {{ ai.skillsUpload }}
          </AppButton>
          <AppSwitch
            v-else
            :model-value="group.enabled"
            :label="sourceTitle(group)"
            @update:model-value="skills.setSourceEnabled(group.source, $event)"
          />
        </template>
        <SkillList
          v-if="group.skills.length"
          :entries="group.skills"
          :disabled="!group.enabled"
          @open="skills.open"
          @set-enabled="skills.setSkillEnabled"
        />
        <AppPlaceholder
          v-else
          size="compact"
          :fill="false"
          :label="group.folder ? ai.skillsNoneInFolder : ai.skillsNoUploads"
        />
        <AppAlert
          v-if="group.source === 'openpencil' && uploadFailure"
          tone="error"
          :heading="ai.skillsUploadFailed"
          :description="failureText(uploadFailure)"
        />
        <AppAlert v-if="group.problems.length" tone="warning" :heading="ai.skillsProblems">
          <ul class="flex flex-col gap-0.5">
            <li v-for="problem in group.problems" :key="problem.location">
              <code>{{ problem.location }}</code
              >: {{ problem.error }}
            </li>
          </ul>
        </AppAlert>
      </SettingsSection>
    </div>
  </SettingsPage>
  <AppAlertDialogRoot v-model:open="deleteOpen">
    <AppDialogHeader
      :heading="ai.skillsDelete"
      :description="deleteDescription"
      :show-close="false"
    />
    <AppDialogFooter>
      <AlertDialogCancel as-child>
        <AppButton>{{ common.cancel }}</AppButton>
      </AlertDialogCancel>
      <AlertDialogAction as-child>
        <AppButton color="error" variant="solid" @click="remove">{{ ai.skillsDelete }}</AppButton>
      </AlertDialogAction>
    </AppDialogFooter>
  </AppAlertDialogRoot>
</template>
