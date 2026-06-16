import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Risks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Risques' }).click();
    await expect(page.getByRole('heading', { name: 'Gestion des risques' })).toBeVisible();
  });

  test('shows risk matrix and stats cards', async ({ page }) => {
    await expect(page.locator('text=Total risques')).toBeVisible();
    await expect(page.locator('text=Matrice des risques')).toBeVisible();
    // "Registre des risques" also appears in the page description, so target the heading.
    await expect(page.getByRole('heading', { name: 'Registre des risques' })).toBeVisible();
  });

  test('opens and closes the creation form', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau risque' }).click();
    await expect(page.getByRole('heading', { name: 'Enregistrer un risque' })).toBeVisible();
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByRole('heading', { name: 'Enregistrer un risque' })).not.toBeVisible();
  });

  test('shows live risk score preview while editing', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau risque' }).click();

    // Default score: 3 × 3 = 9
    await expect(page.locator('text=Score calculé : 9 / 25')).toBeVisible();

    // Change likelihood to 5 → 5 × 3 = 15
    await page.getByLabel('Probabilité (1-5)').selectOption('5');
    await expect(page.locator('text=Score calculé : 15 / 25')).toBeVisible();

    // Change impact to 5 → 5 × 5 = 25
    await page.getByLabel('Impact (1-5)').selectOption('5');
    await expect(page.locator('text=Score calculé : 25 / 25')).toBeVisible();
  });

  test('creates a new risk and shows it in the register', async ({ page }) => {
    const title = `Risque E2E ${Date.now()}`;

    await page.getByRole('button', { name: 'Nouveau risque' }).click();

    await page.getByLabel('Titre').fill(title);
    await page.getByLabel('Catégorie').selectOption('SUPPLY_CHAIN');
    await page.getByLabel('Probabilité (1-5)').selectOption('4');
    await page.getByLabel('Impact (1-5)').selectOption('5');
    await page.getByLabel('Description').fill('Risque E2E Playwright : dépendance fournisseur critique');
    await page.getByLabel('Plan de mitigation').fill('Diversification des fournisseurs');

    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Form closes on success
    await expect(page.getByRole('heading', { name: 'Enregistrer un risque' })).not.toBeVisible();

    // New risk appears in the register — scope to its unique row so the score
    // assertion (4 × 5 = 20) does not collide with other risks sharing a score.
    const row = page.locator('tr', { hasText: title });
    await expect(row).toBeVisible();
    await expect(row.getByText('20')).toBeVisible();
  });

  test('validates required fields before submitting', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau risque' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    // HTML5 validation keeps form open
    await expect(page.getByRole('heading', { name: 'Enregistrer un risque' })).toBeVisible();
  });
});
