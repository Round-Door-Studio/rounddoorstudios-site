import { test, expect } from '@playwright/test';

// ep 1 — always the first released story; safe to hardcode
const RELEASED_SLUG = 'frog-at-the-bottom-of-the-well';

test.describe('Story page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/story/${RELEASED_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('renders story title', async ({ page }) => {
    await expect(page.locator('.read-hero h1')).toBeVisible();
  });

  test('renders the story pack tabs', async ({ page }) => {
    await expect(page.locator('.pack-cards')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Read Along/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /New Words/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Curious Questions/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Culture Corner/i })).toBeVisible();
  });

  test('read along panel is active by default', async ({ page }) => {
    const panel = page.locator('#pack-panel-read');
    await expect(panel).toBeVisible();
  });

  test('switching to New Words tab shows vocab', async ({ page }) => {
    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('#pack-panel-words')).toBeVisible();
    await expect(page.locator('.pack-vocab-card').first()).toBeVisible();
  });

  test('switching to Curious Questions tab shows questions', async ({ page }) => {
    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await expect(page.locator('#pack-panel-questions')).toBeVisible();
    await expect(page.locator('.pack-q-card').first()).toBeVisible();
  });

  test('switching to Culture Corner tab shows activities', async ({ page }) => {
    await page.getByRole('tab', { name: /Culture Corner/i }).click();
    await expect(page.locator('#pack-panel-explore')).toBeVisible();
  });

  test('reading mode toggle switches between simp and trad', async ({ page }) => {
    const tradBtn = page.getByRole('tab', { name: /繁 Traditional/i });
    await tradBtn.click();
    await expect(page.locator('#reading')).toHaveClass(/mode-trad/);
  });

  test('compare mode shows side-by-side layout', async ({ page }) => {
    await page.getByRole('tab', { name: /Compare/i }).click();
    await expect(page.locator('#reading')).toHaveClass(/mode-compare/);
  });

  // ── Reading mode content visibility ──────────────────────────────────────────
  test('simp mode shows simplified column and hides traditional column', async ({ page }) => {
    // simp is the default mode
    await expect(page.locator('.rd-zh .rd-col--simp').first()).toBeVisible();
    await expect(page.locator('.rd-zh .rd-col--trad').first()).not.toBeVisible();
  });

  test('trad mode shows traditional column and hides simplified column', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="trad"]').click();
    await expect(page.locator('.rd-zh .rd-col--trad').first()).toBeVisible();
    await expect(page.locator('.rd-zh .rd-col--simp').first()).not.toBeVisible();
  });

  test('switching back to simp restores simplified column', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="trad"]').click();
    await page.locator('.rc-mode[data-mode="simp"]').click();
    await expect(page.locator('.rd-zh .rd-col--simp').first()).toBeVisible();
    await expect(page.locator('.rd-zh .rd-col--trad').first()).not.toBeVisible();
  });

  test('compare mode hides single columns and shows side-by-side grid', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="compare"]').click();
    await expect(page.locator('.rd-zh').first()).not.toBeVisible();
    await expect(page.locator('.rd-compare').first()).toBeVisible();
  });

  test('back link returns to library', async ({ page }) => {
    await page.getByRole('link', { name: /Back to the library/i }).click();
    await expect(page).toHaveURL('/library');
  });

  test('listen control switches between English and Chinese', async ({ page }) => {
    const zhBtn = page.locator('.listen-control--detail').getByRole('tab', { name: '中文' });
    await zhBtn.click();
    await expect(page.locator('.listen-control--detail')).toHaveAttribute('data-active-lang', 'zh');
  });

  // ── Compare mode revert ──────────────────────────────────────────────────────
  test('compare mode reverts to simp when switching to another tab', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="compare"]').click();
    await expect(page.locator('#reading')).toHaveClass(/mode-compare/);

    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('.rc-mode[data-mode="simp"]')).toHaveClass(/is-on/);
    await expect(page.locator('.rc-mode[data-mode="compare"]')).not.toHaveClass(/is-on/);
  });

  test('compare mode reverts to trad when trad was chosen before compare', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="trad"]').click();
    await page.locator('.rc-mode[data-mode="compare"]').click();

    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await expect(page.locator('.rc-mode[data-mode="trad"]')).toHaveClass(/is-on/);
  });

  test('returning to read tab after compare restores compare mode', async ({ page }) => {
    await page.locator('.rc-mode[data-mode="compare"]').click();
    await page.getByRole('tab', { name: /New Words/i }).click();
    await page.getByRole('tab', { name: /Read Along/i }).click();
    await expect(page.locator('#reading')).toHaveClass(/mode-compare/);
  });

  // ── Show English across all tabs ─────────────────────────────────────────────
  test('unchecking Show English hides english on the vocab tab', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('.pack-vocab-en').first()).not.toBeVisible();
  });

  test('unchecking Show English hides english on the questions tab', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await expect(page.locator('.pack-q-text').first()).not.toBeVisible();
  });

  test('unchecking Show English hides english on the culture corner tab', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /Culture Corner/i }).click();
    await expect(page.locator('.pack-act-desc').first()).not.toBeVisible();
  });

  // ── Print button ─────────────────────────────────────────────────────────────
  test('print button exists with correct id for right-alignment', async ({ page }) => {
    await expect(page.locator('#c-print')).toBeVisible();
  });

  test('print button calls window.print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      window.print = () => { (window as any).__printCalled = true; };
    });
    await page.goto(`/story/${RELEASED_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.locator('#c-print').click();
    expect(await page.evaluate(() => (window as any).__printCalled)).toBe(true);
  });

  test('data-print-tab updates when switching tabs', async ({ page }) => {
    await expect(page.locator('.pack-panels')).toHaveAttribute('data-print-tab', 'read');
    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('.pack-panels')).toHaveAttribute('data-print-tab', 'words');
    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await expect(page.locator('.pack-panels')).toHaveAttribute('data-print-tab', 'questions');
    await page.getByRole('tab', { name: /Culture Corner/i }).click();
    await expect(page.locator('.pack-panels')).toHaveAttribute('data-print-tab', 'explore');
  });

  // ── Print respects Show English toggle ───────────────────────────────────────
  test('print shows English vocab when Show English is on', async ({ page }) => {
    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('#c-en')).toBeChecked(); // on by default
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.pack-vocab-en').first()).toBeVisible();
  });

  test('print hides English vocab when Show English is off', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /New Words/i }).click();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.pack-vocab-en').first()).not.toBeVisible();
  });

  test('print hides English questions when Show English is off', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.pack-q-text').first()).not.toBeVisible();
  });

  test('print hides English activity text when Show English is off', async ({ page }) => {
    await page.locator('#c-en').uncheck();
    await page.getByRole('tab', { name: /Culture Corner/i }).click();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.pack-act-desc').first()).not.toBeVisible();
  });
});

// ── All released story pages load ────────────────────────────────────────────
test('every released story page loads without error', async ({ page }) => {
  // Discover released slugs dynamically from the library grid
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();
  const slugs = await page.locator('.story-card:not(.is-soon)').evaluateAll(
    (cards) => cards.map((c) => c.getAttribute('data-slug')).filter(Boolean)
  );
  expect(slugs.length).toBeGreaterThan(0);

  for (const slug of slugs) {
    await page.goto(`/story/${slug}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.read-hero h1'), `h1 missing on /story/${slug}`).toBeVisible();
    await expect(page.locator('.pack-cards'), `pack missing on /story/${slug}`).toBeVisible();
  }
});

// ── Story nav arrows ──────────────────────────────────────────────────────────
test.describe('Story nav arrows', () => {
  test('first released story has no left arrow and a right arrow', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Story nav arrows are not shown on mobile');
    // Discover the first released slug from the library grid
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Grid/i }).click();
    const slug = await page.locator('.story-card:not(.is-soon)').first().getAttribute('data-slug');

    await page.goto(`/story/${slug}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.story-nav-arrow--l.story-nav-arrow--disabled')).toBeAttached();
    await expect(page.locator('a.story-nav-arrow--r')).toBeVisible();
  });

  test('clicking the right arrow navigates to the next story', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Story nav arrows are not shown on mobile');
    // Discover the first two released slugs
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Grid/i }).click();
    const slugs = await page.locator('.story-card:not(.is-soon)').evaluateAll(
      (cards) => cards.map((c) => c.getAttribute('data-slug')).filter(Boolean)
    );
    if (slugs.length < 2) return; // only one story released — skip

    await page.goto(`/story/${slugs[0]}`);
    await page.waitForLoadState('networkidle');
    await page.locator('a.story-nav-arrow--r').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`/story/${slugs[1]}`);
  });
});

test('unreleased story shows "door not opened" message', async ({ page }) => {
  // Discover an unreleased slug from the library grid rather than hardcoding one
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();
  const slug = await page.locator('.story-card.is-soon').first().getAttribute('data-slug');
  await page.goto(`/story/${slug}`);
  await expect(page.getByText(/hasn't opened yet/i)).toBeVisible();
});
