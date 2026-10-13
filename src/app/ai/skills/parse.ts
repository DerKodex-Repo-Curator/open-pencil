import * as v from 'valibot'
import { parse as parseYAML } from 'yaml'

import type { SkillDefinition } from './types'

/** Limits from the Agent Skills specification (https://agentskills.io/specification). */
const MAX_NAME_LENGTH = 64
const MAX_DESCRIPTION_LENGTH = 1024
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

const FrontmatterSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  'disable-model-invocation': v.optional(v.boolean()),
  'user-invocable': v.optional(v.boolean())
})

export type SkillParseResult =
  | { ok: true; skill: SkillDefinition; warnings: string[] }
  | { ok: false; error: string }

function readFrontmatter(text: string): { data: unknown; body: string } | { error: string } {
  const match = FRONTMATTER.exec(text)
  if (!match) return { error: 'SKILL.md does not start with YAML frontmatter between --- lines.' }
  try {
    return { data: parseYAML(match[1] ?? ''), body: text.slice(match[0].length) }
  } catch (error) {
    return { error: `SKILL.md frontmatter is not valid YAML: ${String(error)}` }
  }
}

/**
 * Reads a SKILL.md as pi and Claude Code do: a skill without a description cannot be offered,
 * so it fails; other departures from the specification are warnings and the skill still loads.
 */
export function parseSkill(text: string, folderName: string): SkillParseResult {
  const frontmatter = readFrontmatter(text)
  if ('error' in frontmatter) return { ok: false, error: frontmatter.error }
  const parsed = v.safeParse(FrontmatterSchema, frontmatter.data ?? {})
  if (!parsed.success) {
    return { ok: false, error: `SKILL.md frontmatter is invalid:\n${v.summarize(parsed.issues)}` }
  }
  const fields = parsed.output
  const description = fields.description?.trim() ?? ''
  if (!description) return { ok: false, error: 'SKILL.md frontmatter has no description.' }

  const warnings: string[] = []
  const name = fields.name?.trim() || folderName
  if (!fields.name?.trim()) warnings.push('No name in the frontmatter; using the folder name.')
  if (name.length > MAX_NAME_LENGTH) {
    warnings.push(`The name is longer than ${MAX_NAME_LENGTH} characters.`)
  }
  if (!NAME_PATTERN.test(name)) {
    warnings.push('The name should use only lowercase letters, digits, and single hyphens.')
  }
  if (name !== folderName) warnings.push(`The name does not match the folder "${folderName}".`)
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    warnings.push(`The description is longer than ${MAX_DESCRIPTION_LENGTH} characters.`)
  }

  return {
    ok: true,
    skill: {
      name,
      description,
      instructions: frontmatter.body.trim(),
      modelInvocable: fields['disable-model-invocation'] !== true,
      userInvocable: fields['user-invocable'] !== false
    },
    warnings
  }
}
