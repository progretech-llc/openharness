import { afterEach, beforeEach, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { env } from '../config/env.js'
import { listDir } from './fsBrowse.js'
import { readGitProject } from './gitProject.js'
import { projectPreview } from './projectPreview.js'
import { projectRoots } from './pathContainment.js'

let root: string
const previous = env.HARNESS_PROJECT_ROOTS
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'harness-project-roots-'))
  await mkdir(join(root, 'Projects', 'example'), { recursive: true })
  await mkdir(join(root, 'private'))
  await writeFile(join(root, 'Projects', 'example', 'README.md'), 'Fixture project')
  await symlink(join(root, 'private'), join(root, 'Projects', 'escape'))
  env.HARNESS_PROJECT_ROOTS = undefined
})
afterEach(async () => {
  env.HARNESS_PROJECT_ROOTS = previous
  await rm(root, { recursive: true, force: true })
})
it('allows an explicitly configured external project root for browsing, preview and Git detection', async () => {
  const project = join(root, 'Projects', 'example')
  expect(await listDir(project)).toEqual({ error: 'FORBIDDEN' })
  env.HARNESS_PROJECT_ROOTS = [join(root, 'Projects'), 'relative', 'bad\npath'].join(delimiter)
  expect(projectRoots()).toContain(join(root, 'Projects'))
  expect(projectRoots()).not.toContain('relative')
  expect(await listDir(project)).toMatchObject({ path: project, entries: [] })
  expect(await projectPreview(project)).toMatchObject({ readme: 'Fixture project' })
  expect(await readGitProject(project)).toMatchObject({ isGit: false })
})
it('keeps siblings and symlink escapes blocked for all project readers', async () => {
  env.HARNESS_PROJECT_ROOTS = join(root, 'Projects')
  for (const path of [join(root, 'private'), join(root, 'Projects', 'escape')]) {
    expect(await listDir(path)).toEqual({ error: 'FORBIDDEN' })
    expect(await projectPreview(path)).toEqual({ error: 'FORBIDDEN' })
    expect(await readGitProject(path)).toEqual({ error: 'FORBIDDEN' })
  }
})
