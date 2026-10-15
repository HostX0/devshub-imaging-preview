import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
const approve = async (page: import('@playwright/test').Page) => {
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('checkbox', {
      name: 'I reviewed the demographics and confirm the selected or new patient identity.',
    })
    .check();
  await dialog
    .getByRole('checkbox', {
      name: 'I reviewed every listed source and confirm all its pages / frames belong to this person.',
    })
    .check();
};
test('human review resets, immediate complete send reaches doctor, notes stay private and patient printable includes every sample frame', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (
      r.url().startsWith('http') &&
      new URL(r.url()).origin !==
        new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4300').origin
    )
      external.push(r.url());
  });
  await page.goto('/#/center/intake/draft1');
  await page
    .getByLabel('Full three-part name *', { exact: true })
    .fill('Sample Reviewed Patient');
  await page.getByLabel('Supplied age *', { exact: true }).fill('12');
  await page.getByLabel('Age unit *', { exact: true }).selectOption('WEEKS');
  await page.getByRole('button', { name: 'Review identity & sources' }).click();
  await approve(page);
  await page.getByRole('button', { name: 'Keep reviewing', exact: true }).click();
  await page.getByRole('button', { name: 'Review identity & sources' }).click();
  await expect(page.getByRole('dialog').getByRole('checkbox').first()).not.toBeChecked();
  await expect(page.getByRole('dialog').getByRole('checkbox').nth(1)).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Send complete package' })).toBeDisabled();
  await approve(page);
  await page.getByRole('button', { name: 'Send complete package' }).click();
  await expect(page.getByRole('heading', { name: 'Complete package delivered' })).toBeVisible();
  await page.getByRole('button', { name: 'Open delivered result' }).click();
  await expect(page.getByText(/12 weeks · Version/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open reader', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open document', exact: true })).toHaveCount(1);
  const examRoute = page.url().split('#')[1]!;
  await page.goto('/#' + examRoute.replace('/center/', '/doctor/'));
  await page.getByRole('button', { name: /My private notes/ }).click();
  await page.getByLabel('Append a private note').fill('Private sample marker for doctor one');
  await page.getByRole('button', { name: 'Save private note' }).click();
  await expect(page.getByText('Private sample marker for doctor one')).toBeVisible();
  await page.goto('/#/doctor');
  await page.getByLabel('Sample doctor identity').selectOption('d2');
  await page.goto('/#/doctor/notes');
  await expect(page.getByText('Private sample marker for doctor one')).toHaveCount(0);
  await page.goto('/#' + examRoute.replace('/center/exams/', '/patient/'));
  await expect(page.getByText('27 pages · ordered sample source coverage')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const downloaded = await downloadPromise;
  const bytes = await readFile((await downloaded.path())!);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  expect(bytes.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(27);
  await expect(page.getByText('Private sample marker for doctor one')).toHaveCount(0);
  expect(external).toEqual([]);
});
test('bulk applies all and individual override, sends ready only, is idempotent and survives refresh', async ({
  page,
}) => {
  await page.goto('/#/center/bulk');
  await page.getByLabel('Apply doctor to all', { exact: true }).selectOption('d2');
  await page.getByRole('button', { name: 'Apply to all unsent' }).click();
  const card = page
    .locator('.bulk-card')
    .filter({ has: page.getByRole('heading', { name: 'Sample Bulk Patient A' }) });
  await card
    .getByRole('combobox', { name: 'Doctor for Sample Bulk Patient A', exact: true })
    .selectOption('d1');
  await card.getByRole('button', { name: 'Human review' }).click();
  await approve(page);
  await page.getByRole('button', { name: 'Mark reviewed for bulk' }).click();
  await expect(
    page.getByRole('button', { name: 'Send 1 ready person', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Send 1 ready person', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByText('1 unresolved person card stays held.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Send ready packages' }).click();
  await expect(card.getByText('Delivered', { exact: true })).toBeVisible();
  await expect(
    page.locator('.bulk-card').nth(1).getByText('Held', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Send 0 ready people', exact: true }),
  ).toBeDisabled();
  const count = await page.evaluate(
    () => JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).exams.length,
  );
  expect(count).toBe(9);
  await page.reload();
  await expect(card.getByText('Delivered', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).exams.length,
    ),
  ).toBe(9);
});
test('local upload stays browser-only; refresh blocks stale approval and exact byte reselect restores the same source', async ({
  page,
}) => {
  await page.goto('/#/center/exams/e1-0');
  const downloadPromise = page.waitForEvent('download');
  await page
    .locator('.exam-sources article')
    .filter({ hasText: 'Sample received report.pdf' })
    .getByRole('button', { name: 'Original', exact: true })
    .click();
  const downloaded = await downloadPromise;
  const file = await readFile((await downloaded.path())!);
  await page.goto('/#/center/intake');
  await page.getByRole('button', { name: 'Create intake draft' }).click();
  await page.getByLabel('Full three-part name *', { exact: true }).fill('Sample Local Patient');
  await page.getByLabel('Supplied age *', { exact: true }).fill('44');
  await page
    .getByRole('combobox', { name: 'Primary referring doctor', exact: true })
    .selectOption('d1');
  await page.locator('input[type=file]').setInputFiles({
    name: 'sample-local-report.pdf',
    mimeType: 'application/pdf',
    buffer: file,
  });
  await expect(page.getByText('sample-local-report.pdf', { exact: true })).toBeVisible();
  const sourceId = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).drafts[0].sources[0].id,
  );
  await page.reload();
  await expect(
    page.getByText('Re-select the missing local files before review or delivery.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review identity & sources' })).toBeDisabled();
  await page.locator('input[type=file]').setInputFiles({
    name: 'sample-local-report.pdf',
    mimeType: 'application/pdf',
    buffer: file,
  });
  await expect(page.getByRole('button', { name: 'Review identity & sources' })).toBeEnabled();
  const retained = await page.evaluate(
    () => JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).drafts[0].sources,
  );
  expect(retained).toHaveLength(1);
  expect(retained[0].id).toBe(sourceId);
});
test('admin exact grants do not add future visits, patient merge preserves eligible history and lifecycle restore retains it', async ({
  page,
}) => {
  await page.goto('/#/admin/patients');
  await page.getByRole('button', { name: 'New standalone profile' }).click();
  await page.getByLabel('Full three-part name', { exact: true }).fill('Only');
  await page
    .getByRole('checkbox', {
      name: 'I reviewed these details and confirm this is a distinct new person.',
    })
    .check();
  await expect(page.getByRole('button', { name: 'Save reviewed profile' })).toBeDisabled();
  await page
    .getByLabel('Full three-part name', { exact: true })
    .fill('Sample Standalone Patient');
  await page.getByLabel('Supplied age in years', { exact: true }).fill('46');
  await page
    .getByRole('checkbox', {
      name: 'I reviewed these details and confirm this is a distinct new person.',
    })
    .check();
  await page.getByRole('button', { name: 'Save reviewed profile' }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).exams.length,
    ),
  ).toBe(8);
  await page.goto('/#/admin/patients/p1');
  await page.getByRole('button', { name: 'Review doctor grants' }).click();
  await page.getByLabel('Package scope', { exact: true }).selectOption('one');
  await page
    .getByRole('dialog')
    .getByRole('checkbox', { name: /Dr. Sample Omar Hassan/ })
    .check();
  await page
    .getByRole('checkbox', {
      name: 'I reviewed this exact impact and the selected whole-package versions.',
    })
    .check();
  await page.getByRole('button', { name: 'Apply reviewed access' }).click();
  const exams = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('devshub-interactive-demo-v2')!).exams.filter(
      (e: { patientId: string }) => e.patientId === 'p1',
    ),
  );
  expect(
    exams.filter((e: { grants: Record<string, string> }) => e.grants.d2 === 'ACTIVE'),
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'Merge with existing profile' }).click();
  await page.getByLabel('Original source profile').selectOption('p2');
  await page
    .getByLabel('Evidence / reason')
    .fill('Reviewed synthetic matching identity for demo');
  await page
    .getByRole('checkbox', {
      name: 'I reviewed both people and confirm they represent the same person.',
    })
    .check();
  await page.getByRole('button', { name: 'Confirm reviewed merge' }).click();
  await expect(page.getByText('Reviewed aliases: DH-00249.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Delete with recovery grace' }).click();
  await page
    .getByRole('checkbox', {
      name: 'I reviewed this profile and its complete retained visit history.',
    })
    .check();
  await page.getByRole('button', { name: 'Confirm delete', exact: false }).click();
  await page.goto('/#/patient/e1-0');
  await expect(
    page.getByRole('heading', { name: 'This sample result is unavailable' }),
  ).toBeVisible();
  await page.goto('/#/admin/patients/p1');
  await page.getByRole('button', { name: 'Restore retained record' }).click();
  await page
    .getByRole('checkbox', {
      name: 'I reviewed this profile and its complete retained visit history.',
    })
    .check();
  await page.getByRole('button', { name: 'Confirm restore', exact: false }).click();
  await page.goto('/#/patient/e1-0');
  await expect(
    page.getByRole('heading', { name: 'Your result, ready to view.' }),
  ).toBeVisible();
});
test('phone reader renders real synthetic pixels, supports frames and temporary measurements, and closes without retaining annotations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/doctor/exams/e1-0');
  await page.getByRole('button', { name: 'Open reader', exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  const canvas = page.locator('.image-viewport canvas');
  await expect(canvas).toBeVisible();
  const digest = () =>
    canvas.evaluate(async (el) => {
      const c = el as HTMLCanvasElement;
      const p = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', p)))
        .map((x) => x.toString(16))
        .join('');
    });
  const before = await digest();
  await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  expect(await digest()).not.toBe(before);
  await page.getByRole('button', { name: 'Length', exact: true }).click();
  const rect = await page.locator('.image-viewport').boundingBox();
  await page.mouse.move(rect!.x + rect!.width * 0.3, rect!.y + rect!.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(rect!.x + rect!.width * 0.6, rect!.y + rect!.height * 0.6);
  await page.mouse.up();
  await expect(page.locator('[data-measurement="Length"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close reader' }).click();
  await page.getByRole('button', { name: 'Open reader', exact: true }).click();
  await expect(page.locator('[data-measurement="Length"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBe(0);
});
