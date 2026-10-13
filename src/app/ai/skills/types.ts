/** What a SKILL.md says about itself: its frontmatter and the instructions below it. */
export interface SkillDefinition {
  name: string
  description: string
  /** The Markdown body, which the model reads when it loads the skill. */
  instructions: string
  /** Listed for the model to load on its own; `disable-model-invocation` turns this off. */
  modelInvocable: boolean
  /** Offered for the user to run by name; `user-invocable: false` turns this off. */
  userInvocable: boolean
}

/** Where skills come from: the shared Agent Skills folder and Claude Code's. */
export type SkillSourceID = 'agents' | 'claude'

export interface Skill extends SkillDefinition {
  source: SkillSourceID
  /** Where the skill was found, as the user sees it. */
  location: string
  /** Files in the skill's folder other than SKILL.md, relative to the folder. */
  files: readonly string[]
  readFile: (path: string) => Promise<string>
  /** Departures from the Agent Skills specification that did not stop the skill loading. */
  warnings: readonly string[]
}

/** A folder with a SKILL.md that could not be read as a skill. */
export interface SkillProblem {
  source: SkillSourceID
  folder: string
  location: string
  error: string
}

export interface SkillScan {
  skills: Skill[]
  problems: SkillProblem[]
}
