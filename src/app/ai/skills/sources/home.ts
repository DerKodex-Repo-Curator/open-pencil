import * as v from 'valibot'

import { parseSkill } from '../parse'
import type { Skill, SkillScan, SkillSourceID } from '../types'

/** The folders other agents install skills into, in the order a repeated name resolves. */
export const HOME_SKILL_SOURCES: readonly { id: SkillSourceID; folder: readonly string[] }[] = [
  { id: 'agents', folder: ['.agents', 'skills'] },
  { id: 'claude', folder: ['.claude', 'skills'] }
]

const SkillFoldersSchema = v.array(
  v.object({
    name: v.string(),
    path: v.string(),
    skillFile: v.string(),
    files: v.array(v.string())
  })
)

export type SkillFolder = v.InferOutput<typeof SkillFoldersSchema>[number]

export interface HomeSkillReader {
  /** The skill folders directly inside `root`; empty when it does not exist. */
  folders: (root: string) => Promise<unknown>
  readFile: (dir: string, path: string) => Promise<string>
}

/** Turns the folders one source holds into skills, and the ones that are not into problems. */
export function skillsFromFolders(
  source: SkillSourceID,
  displayRoot: string,
  folders: readonly SkillFolder[],
  readFile: HomeSkillReader['readFile']
): SkillScan {
  const scan: SkillScan = { skills: [], problems: [] }
  for (const folder of folders) {
    const location = `${displayRoot}/${folder.name}`
    const parsed = parseSkill(folder.skillFile, folder.name)
    if (!parsed.ok) {
      scan.problems.push({ source, folder: folder.name, location, error: parsed.error })
      continue
    }
    const skill: Skill = {
      ...parsed.skill,
      source,
      location,
      files: folder.files,
      readFile: (path) => readFile(folder.path, path),
      warnings: parsed.warnings
    }
    scan.skills.push(skill)
  }
  return scan
}

/** Reads every home source; a source that cannot be read contributes nothing. */
export async function readHomeSkills(home: string, reader: HomeSkillReader): Promise<SkillScan> {
  const scans = await Promise.all(
    HOME_SKILL_SOURCES.map(async ({ id, folder }) => {
      const result = v.safeParse(
        SkillFoldersSchema,
        await reader.folders([home, ...folder].join('/')).catch(() => [])
      )
      const folders = result.success ? result.output : []
      return skillsFromFolders(id, `~/${folder.join('/')}`, folders, reader.readFile)
    })
  )
  return {
    skills: scans.flatMap((scan) => scan.skills),
    problems: scans.flatMap((scan) => scan.problems)
  }
}

/** The desktop's reader, through the shell's skill commands. */
export async function nativeHomeSkillReader(): Promise<HomeSkillReader> {
  const { invoke } = await import('@tauri-apps/api/core')
  return {
    folders: (root) => invoke<unknown>('skill_folders', { root }),
    readFile: (dir, path) => invoke<string>('skill_folder_file', { dir, path })
  }
}
