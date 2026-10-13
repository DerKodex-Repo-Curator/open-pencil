import { computed, shallowRef } from 'vue'

import { IS_TAURI } from '@open-pencil/core/constants'

import { enabledSkillsFrom, skillPreferences } from './preferences'
import { nativeHomeSkillReader, readHomeSkills } from './sources/home'
import type { Skill, SkillScan } from './types'

/** What the chat needs from skills: a fresh read before a message, then the enabled list. */
export interface SkillLibrary {
  refresh: () => Promise<void>
  enabled: () => readonly Skill[]
}

/** Every skill found, and the folders that failed, from the last read. */
export const foundSkills = shallowRef<SkillScan>({ skills: [], problems: [] })

export const enabledSkills = computed(() =>
  enabledSkillsFrom(foundSkills.value.skills, skillPreferences.value)
)

let reading: Promise<void> | null = null

/** Reads the skill folders again; the browser has none to read. */
export function refreshSkills(): Promise<void> {
  if (!IS_TAURI) return Promise.resolve()
  reading ??= (async () => {
    try {
      const { homeDir } = await import('@tauri-apps/api/path')
      foundSkills.value = await readHomeSkills(await homeDir(), await nativeHomeSkillReader())
    } catch (error) {
      // The last read stays; a message must not fail because a folder could not be read.
      console.warn('Could not read skills', error)
    } finally {
      reading = null
    }
  })()
  return reading
}

export const appSkillLibrary: SkillLibrary = {
  refresh: refreshSkills,
  enabled: () => enabledSkills.value
}
