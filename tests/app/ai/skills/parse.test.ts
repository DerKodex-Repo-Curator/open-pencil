import { describe, expect, test } from 'bun:test'

import dedent from 'dedent'

import { parseSkill } from '@/app/ai/skills/parse'

describe('parseSkill', () => {
  test('reads the frontmatter and the instructions below it', () => {
    const result = parseSkill(
      dedent`
        ---
        name: brand-review
        description: Check a layout against the brand guide.
        disable-model-invocation: true
        ---

        # Brand review

        Use the brand colors only.
      `,
      'brand-review'
    )
    expect(result).toEqual({
      ok: true,
      skill: {
        name: 'brand-review',
        description: 'Check a layout against the brand guide.',
        instructions: '# Brand review\n\nUse the brand colors only.',
        modelInvocable: false,
        userInvocable: true
      },
      warnings: []
    })
  })

  test('keeps fields it does not use out of the way', () => {
    const result = parseSkill(
      '---\nname: grid\ndescription: Grids.\nlicense: MIT\nmetadata:\n  author: someone\n---\nBody',
      'grid'
    )
    expect(result.ok && result.warnings).toEqual([])
  })

  test('fails a skill that cannot be offered', () => {
    expect(parseSkill('# No frontmatter', 'grid').ok).toBe(false)
    expect(parseSkill('---\nname: grid\n---\nBody', 'grid').ok).toBe(false)
    expect(parseSkill('---\nname: grid\ndescription: [unclosed\n---\n', 'grid').ok).toBe(false)
    expect(parseSkill('---\nname: grid\ndescription: 42\n---\n', 'grid').ok).toBe(false)
  })

  test('loads a skill that departs from the specification, with warnings', () => {
    const unnamed = parseSkill('---\ndescription: Grids.\n---\nBody', 'grid')
    expect(unnamed.ok && unnamed.skill.name).toBe('grid')
    expect(unnamed.ok && unnamed.warnings.length).toBeGreaterThan(0)

    const misnamed = parseSkill('---\nname: Grid Rules\ndescription: Grids.\n---\nBody', 'grid')
    expect(misnamed.ok && misnamed.skill.name).toBe('Grid Rules')
    expect(misnamed.ok && misnamed.warnings.length).toBeGreaterThan(0)
  })
})
