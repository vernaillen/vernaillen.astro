import { expect, test } from '@playwright/test'

const publicPages = ['/', '/projects', '/open-source', '/career', '/about', '/blog', '/blog/wpnuxt-v2']

for (const path of publicPages) {
  test(`${path} fits the viewport`, async ({ page }) => {
    await page.goto(path)
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
  })
}

test('technical articles retain readable Markdown structure', async ({ page }) => {
  await page.goto('/blog/wpnuxt-v2')
  const firstList = page.locator('article ul').first()
  await expect(firstList).toBeVisible()
  expect(await firstList.evaluate((element) => getComputedStyle(element).listStyleType)).not.toBe('none')

  const table = page.locator('article table').first()
  await expect(table).toBeVisible()
  expect(await table.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto')

  await page.evaluate(() => localStorage.setItem('color-mode', 'light'))
  await page.reload()
  const contrast = await page.locator('article a').first().evaluate((element) => {
    const toRgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number)
    const luminance = (rgb: number[]) => {
      const values = rgb.map((channel) => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722
    }
    const foreground = luminance(toRgb(getComputedStyle(element).color))
    const background = luminance(toRgb(getComputedStyle(document.body).backgroundColor))
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
})

test('search opens from the keyboard and finds articles', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+KeyK')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('searchbox').fill('WPNuxt 2')
  await expect(dialog.getByRole('link', { name: /WPNuxt 2.0/ })).toBeVisible()
})

test('homepage shows evidence, a concise career preview, and the FAQ', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Government citizen portal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Full career' })).toBeVisible()
  await expect(page.locator('section').filter({ hasText: 'Work Experience' }).locator('a[href^="http"]')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible()
})

test('navigation exposes current state and the mobile menu closes with Escape', async ({ page, isMobile }) => {
  await page.goto('/projects')
  if (isMobile) {
    const menuButton = page.getByRole('button', { name: 'Toggle menu' })
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('aria-current', 'page')
    await page.keyboard.press('Escape')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  } else {
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('aria-current', 'page')
  }
})

test('404 pages are excluded from indexing and have a social card', async ({ page }) => {
  await page.goto('/404.html')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/404\.png$/)
})
