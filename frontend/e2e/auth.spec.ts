import { test, expect } from '@playwright/test';
import { login, ADMIN_EMAIL } from './helpers';

test.describe('Authentication', () => {
  test('login page is accessible when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Adresse e-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Mot de passe').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('text=Identifiants incorrects')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('logout returns to login page', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page).toHaveURL('/login');
  });
});
