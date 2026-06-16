import type { Page } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@nis2.example.com';
export const ADMIN_PASSWORD = 'Admin@1234';

export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL('/', { timeout: 10_000 });
}
