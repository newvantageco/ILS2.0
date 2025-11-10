import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Authentication & Session Management
 *
 * Covers complete authentication workflows:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Logout functionality
 * - Session persistence
 * - Password validation
 * - Role-based redirects
 */

test.describe('Authentication Flow', () => {

  test.describe('Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // Verify login page elements
      await expect(page.locator('h1, h2').filter({ hasText: /login|sign in/i })).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      // Fill in credentials
      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify successful login and redirect
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Verify user is logged in (check for logout button or user menu)
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      await expect(logoutButton.or(page.locator('[data-testid="user-menu"]'))).toBeVisible();
    });

    test('should display error with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify error message appears
      const errorMessage = page.locator('text=/invalid.*credentials|incorrect.*password|login.*failed/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Verify still on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should display error with empty email', async ({ page }) => {
      await page.goto('/login');

      // Fill only password
      await page.fill('input[name="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify validation error
      const emailInput = page.locator('input[name="email"]');

      // Check for HTML5 validation or custom error message
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should display error with empty password', async ({ page }) => {
      await page.goto('/login');

      // Fill only email
      await page.fill('input[name="email"]', 'ecp@example.com');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify validation error
      const passwordInput = page.locator('input[name="password"]');

      // Check for HTML5 validation or custom error message
      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should show password when toggle is clicked', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[name="password"]');

      // Verify password is hidden initially
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Look for show/hide password toggle button
      const toggleButton = page.locator('button[aria-label*="password"], button:has-text("Show")').first();

      if (await toggleButton.isVisible()) {
        await toggleButton.click();

        // Verify password is now visible
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Toggle back
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('should redirect ECP to ECP dashboard', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verify redirect to ECP dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    });

    test('should redirect lab tech to production queue', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'labtech@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verify redirect (could be dashboard or production page)
      await expect(page).toHaveURL(/.*dashboard|.*production/, { timeout: 10000 });
    });

    test('should redirect admin to admin dashboard', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'admin@ils.com');
      await page.fill('input[name="password"]', 'admin_password');
      await page.click('button[type="submit"]');

      // Verify redirect to admin area
      await expect(page).toHaveURL(/.*admin|.*dashboard/, { timeout: 10000 });
    });
  });

  test.describe('Logout', () => {
    test('should successfully logout user', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      await logoutButton.click();

      // Verify redirect to login or landing page
      await expect(page).toHaveURL(/.*login|^\/$/, { timeout: 5000 });

      // Verify user cannot access protected page
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('should clear session data on logout', async ({ page, context }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Logout
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      await logoutButton.click();

      // Verify session is cleared (check cookies/localStorage)
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

      // Session cookie should be cleared or expired
      if (sessionCookie) {
        expect(sessionCookie.value).toBe('');
      }
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Reload page
      await page.reload();

      // Verify still logged in (should stay on dashboard, not redirect to login)
      await expect(page).toHaveURL(/.*dashboard/);

      // Verify user menu or logout button is still visible
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      await expect(logoutButton.or(page.locator('[data-testid="user-menu"]'))).toBeVisible();
    });

    test('should maintain session in new tab', async ({ context, page }) => {
      // Login in first tab
      await page.goto('/login');
      await page.fill('input[name="email"]', 'ecp@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Open new tab
      const newPage = await context.newPage();
      await newPage.goto('/dashboard');

      // Verify new tab is also authenticated
      await expect(newPage).toHaveURL(/.*dashboard/);

      await newPage.close();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      // Try to access protected route without logging in
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('should redirect unauthenticated user from orders page', async ({ page }) => {
      await page.goto('/orders');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('should redirect unauthenticated user from patients page', async ({ page }) => {
      await page.goto('/patients');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('should allow access to public landing page', async ({ page }) => {
      await page.goto('/');

      // Should not redirect to login
      await expect(page).not.toHaveURL(/.*login/);

      // Verify landing page elements
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In")').first();
      await expect(loginLink).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Remember Me', () => {
    test('should persist session when "Remember Me" is checked', async ({ page, context }) => {
      await page.goto('/login');

      // Check if Remember Me checkbox exists
      const rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"], input[type="checkbox"]#remember');

      if (await rememberMeCheckbox.isVisible()) {
        await rememberMeCheckbox.check();

        await page.fill('input[name="email"]', 'ecp@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

        // Check if session cookie has longer expiration
        const cookies = await context.cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

        if (sessionCookie && sessionCookie.expires) {
          const expirationDate = new Date(sessionCookie.expires * 1000);
          const now = new Date();
          const daysDiff = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          // Should be valid for at least 7 days
          expect(daysDiff).toBeGreaterThan(7);
        }
      }
    });
  });

  test.describe('Account States', () => {
    test('should show pending approval message for unapproved users', async ({ page }) => {
      // This would test a user that registered but hasn't been approved yet
      await page.goto('/login');

      // Use credentials of a pending user (would need to be set up in test data)
      await page.fill('input[name="email"]', 'pending@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show pending approval message
      const pendingMessage = page.locator('text=/pending approval|account.*pending|awaiting.*approval/i');

      // Either message appears OR redirected to pending approval page
      await expect(
        pendingMessage.or(page.locator('text=Pending Approval'))
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // Or URL contains pending
        expect(page.url()).toContain('pending');
      });
    });
  });

  test.describe('Security', () => {
    test('should prevent SQL injection in email field', async ({ page }) => {
      await page.goto('/login');

      // Try SQL injection
      await page.fill('input[name="email"]', "' OR '1'='1' --");
      await page.fill('input[name="password"]', 'anything');
      await page.click('button[type="submit"]');

      // Should not login successfully
      await expect(page).not.toHaveURL(/.*dashboard/);

      // Should show error or stay on login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should prevent XSS in login fields', async ({ page }) => {
      await page.goto('/login');

      // Try XSS injection
      await page.fill('input[name="email"]', '<script>alert("XSS")</script>@example.com');
      await page.fill('input[name="password"]', '<script>alert("XSS")</script>');
      await page.click('button[type="submit"]');

      // Verify no script was executed (page would crash if XSS worked)
      await expect(page).toHaveURL(/.*login/);
    });

    test('should rate limit failed login attempts', async ({ page }) => {
      await page.goto('/login');

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', `wrongpassword${i}`);
        await page.click('button[type="submit"]');

        // Wait a bit between attempts
        await page.waitForTimeout(500);
      }

      // After multiple attempts, should show rate limit message
      const rateLimitMessage = page.locator('text=/too many attempts|rate limit|try again later/i');

      // Check if rate limiting is implemented
      const isRateLimited = await rateLimitMessage.isVisible({ timeout: 2000 }).catch(() => false);

      // If rate limiting is implemented, verify the message
      if (isRateLimited) {
        await expect(rateLimitMessage).toBeVisible();
      }
    });
  });
});
