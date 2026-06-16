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

    // New organization appears in the table — scope to its unique row so the
    // assertion is robust against other organizations (e.g. the seeded one
    // also located in France).
    const row = page.locator('tr', { hasText: orgName });
    await expect(row).toBeVisible();
    await expect(row.getByText('France')).toBeVisible();
  });

  test('shows organization details on clicking Détails', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await rows.first().getByRole('button', { name: 'Détails' }).click();
    // Stats panel appears — scope to the definition list to avoid matching the
    // sidebar nav links ("Incidents", "Risques").
    const stats = page.locator('dl');
    await expect(stats.getByText('Score de conformité')).toBeVisible();
    await expect(stats.getByText('Incidents')).toBeVisible();
    await expect(stats.getByText('Risques')).toBeVisible();
  });
});
