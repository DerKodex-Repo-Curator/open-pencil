import { expect, test, type Page } from '@playwright/test'
import { strToU8, zipSync } from 'fflate'

import { CanvasHelper } from '#tests/helpers/canvas'

const SKILL =
  '---\nname: grid\ndescription: Lay out pages on an eight-point grid.\n---\n# Grid\n\nSnap every frame to multiples of 8.'

async function openSkills(page: Page) {
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+,' : 'Control+,')
  await page.getByRole('tab', { name: 'Skills', exact: true }).click()
}

async function upload(page: Page, name: string, buffer: Buffer) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Upload skill' }).click()
  await (await chooser).setFiles({ name, mimeType: 'application/octet-stream', buffer })
}

test('an uploaded skill can be turned off, read, and deleted', async ({ page }) => {
  await page.goto('/?test')
  const canvas = new CanvasHelper(page)
  await canvas.waitForInit()
  await openSkills(page)

  await upload(page, 'grid.zip', Buffer.from(zipSync({ 'grid/SKILL.md': strToU8(SKILL) })))
  const toggle = page.getByRole('switch', { name: 'grid', exact: true })
  await expect(toggle).toHaveAttribute('data-state', 'checked')
  await toggle.click()

  await page.reload()
  await canvas.waitForInit()
  await openSkills(page)
  await expect(toggle).toHaveAttribute('data-state', 'unchecked')

  await page.getByRole('button', { name: /^grid / }).click()
  await expect(page.getByRole('heading', { name: 'Grid', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete skill' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete skill' }).click()
  await expect(page.getByText('No uploaded skills yet.')).toBeVisible()
})

test('a file that holds no skill is refused with the reason', async ({ page }) => {
  await page.goto('/?test')
  await new CanvasHelper(page).waitForInit()
  await openSkills(page)
  await upload(page, 'notes.zip', Buffer.from(zipSync({ 'README.md': strToU8('# Notes') })))
  await expect(
    page.getByRole('alert').filter({ hasText: 'Could not upload the skill' })
  ).toBeVisible()
  await expect(page.getByText('No uploaded skills yet.')).toBeVisible()
})
