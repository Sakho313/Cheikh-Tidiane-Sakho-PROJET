import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Organizations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Organisations' }).click();
    await expect(page.getByRole('heading', { name: 'Organisations' })).toBeVisible();
  });

  test('lists existing organizations', async ({ page }) => {
    // Seed has at least one organization
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('opens and closes the creation form', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouvelle organisation' }).click();
    await expect(page.getByText('Créer une organisation')).toBeVisible();
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByText('Créer une organisation')).not.toBeVisible();
  });

  test('creates a new organization and shows it in the list', async ({ page }) => {
    const orgName = `Org E2E ${Date.now()}`;

    await page.getByRole('button', { name: 'Nouvelle organisation' }).click();

    await page.getByLabel('Nom').fill(orgName);
    await page.getByLabel('Pays').fill('France');
    await page.getByLabel('Secteur').selectOption('HEALTH');
    await page.getByLabel("Type d'entité").selectOption('IMPORTANT');
    await page.getByLabel('E-mail de contact').fill('contact@org-e2e-test.fr');

    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Form closes on success
    await expect(page.getByText('Créer une organisation')).not.toBeVisible();

    // New organization appears in the table
    await expect(page.getByRole('cell', { name: orgName })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'France' })).toBeVisible();
  });

  test('shows organization details on clicking Détails', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await rows.first().getByRole('button', { name: 'Détails' }).click();
    // Stats panel appears
    await expect(page.locator('text=Score de conformité')).toBeVisible();
    await expect(page.locator('text=Incidents')).toBeVisible();
    await expect(page.locator('text=Risques')).toBeVisible();
  });
});
