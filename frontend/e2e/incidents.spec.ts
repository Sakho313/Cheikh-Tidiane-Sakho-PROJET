import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Incidents', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Incidents' }).click();
    await expect(page.getByRole('heading', { name: 'Incidents de sécurité' })).toBeVisible();
  });

  test('shows incidents page with stats cards', async ({ page }) => {
    // OrgSelector auto-selects first org; wait for stats to appear
    await expect(page.locator('text=Total incidents')).toBeVisible();
    await expect(page.locator("text=Non notifiés à l'autorité")).toBeVisible();
    await expect(page.locator('text=Critiques')).toBeVisible();
  });

  test('opens and closes the creation form', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouvel incident' }).click();
    await expect(page.getByRole('heading', { name: 'Déclarer un incident' })).toBeVisible();
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByRole('heading', { name: 'Déclarer un incident' })).not.toBeVisible();
  });

  test('creates a new incident and shows it in the list', async ({ page }) => {
    const title = `Incident E2E ${Date.now()}`;

    await page.getByRole('button', { name: 'Nouvel incident' }).click();

    await page.getByLabel('Titre').fill(title);
    await page.getByLabel("Type d'incident").fill('Phishing');
    await page.getByLabel('Sévérité').selectOption('HIGH');
    await page.getByLabel('Description').fill('Description E2E de test Playwright');
    await page.getByLabel('Systèmes affectés').fill('serveur-mail, VPN');

    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Form closes on success
    await expect(page.getByRole('heading', { name: 'Déclarer un incident' })).not.toBeVisible();

    // New incident appears in the table
    await expect(page.getByRole('cell', { name: title })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Phishing' })).toBeVisible();
  });

  test('validates required fields before submitting', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouvel incident' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    // HTML5 validation prevents submission; form remains open
    await expect(page.getByRole('heading', { name: 'Déclarer un incident' })).toBeVisible();
  });
});
