import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'

import type { SkillListEntry } from '@/app/ai/skills/settings/use'
import type { Skill } from '@/app/ai/skills/types'

import SkillList from './SkillList.vue'

function skill(name: string, description: string): Skill {
  return {
    name,
    description,
    instructions: '',
    modelInvocable: true,
    userInvocable: true,
    source: 'agents',
    location: `~/.agents/skills/${name}`,
    files: [],
    readFile: () => Promise.resolve(''),
    warnings: []
  }
}

const entries: SkillListEntry[] = [
  {
    skill: skill(
      'brand-review',
      'Check a layout against the brand guide: colors, type scale, spacing, and logo clear space. Use when reviewing or polishing marketing pages before they ship.'
    ),
    enabled: true,
    shadowed: false
  },
  { skill: skill('grid', 'Lay out pages on an eight-point grid.'), enabled: true, shadowed: true },
  { skill: skill('pr-review', 'Review GitHub pull requests.'), enabled: false, shadowed: false }
]

const meta = {
  title: 'App/Settings/Skills/List',
  args: { disabled: false },
  render: (args) => ({
    components: { SkillList },
    setup: () => {
      const list = ref(entries.map((entry) => ({ ...entry })))
      const opened = ref('')
      return { args, list, opened }
    },
    template: `
      <div class="max-w-lg bg-panel p-3 text-surface">
        <SkillList
          :entries="list"
          :disabled="args.disabled"
          @open="(skill) => (opened = skill.name)"
          @set-enabled="(skill, enabled) => (list = list.map((entry) => entry.skill === skill ? { ...entry, enabled } : entry))"
        />
        <p class="mt-3 text-xs text-muted" data-opened>{{ opened }}</p>
      </div>`
  })
} satisfies Meta<{ disabled: boolean }>

export default meta
type Story = StoryObj<typeof meta>

export const Sources: Story = {}
export const SourceOff: Story = { args: { disabled: true } }
export const ToggleAndOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('switch', { name: 'pr-review' })
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('data-state', 'checked')
    await userEvent.click(canvas.getByRole('button', { name: /^grid / }))
    await expect(canvasElement.querySelector('[data-opened]')).toHaveTextContent('grid')
  }
}
