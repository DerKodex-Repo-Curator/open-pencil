import { shallowRef } from 'vue'

import type { Skill } from './types'

/** The skills the chat offers the model, after the user's choices; sources replace the list. */
export const enabledSkills = shallowRef<readonly Skill[]>([])
