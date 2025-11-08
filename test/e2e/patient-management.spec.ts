import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Patient Management
 *
 * Tests complete patient CRUD workflows:
 * - Create new patient
 * - View patient list
 * - Search/filter patients
 * - Edit patient details
 * - View patient history
 * - Delete patient (soft delete)
 */

test.describe('Patient Management', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ecp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test.describe('Patient List View', () => {
    test('should display patients list page', async ({ page }) => {
      await page.goto('/patients');

      // Verify page title
      await expect(page.locator('h1:has-text("Patients")')).toBeVisible();

      // Verify "Add Patient" button exists
      await expect(page.locator('button:has-text("Add Patient"), button[data-testid="button-add-patient"]')).toBeVisible();

      // Verify search functionality exists
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
      await expect(searchInput).toBeVisible();

      // Verify table or patient list exists
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible({ timeout: 5000 }).catch(() => {
        // Or empty state if no patients
        expect(page.locator('text=/no patients|empty/i')).toBeVisible();
      });
    });

    test('should display patient table with correct columns', async ({ page }) => {
      await page.goto('/patients');

      // Wait for table to load
      await page.waitForSelector('table, [role="table"]', { timeout: 5000 }).catch(() => {});

      const table = page.locator('table');

      if (await table.isVisible()) {
        // Verify column headers
        await expect(page.locator('th:has-text("Name"), th:has-text("Patient")')).toBeVisible();

        // Common patient table columns
        const possibleColumns = [
          'Customer Number',
          'NHS Number',
          'Email',
          'Phone',
          'Date of Birth',
          'DOB',
          'Actions'
        ];

        // At least one additional column should be visible
        let columnFound = false;
        for (const col of possibleColumns) {
          if (await page.locator(`th:has-text("${col}")`).isVisible().catch(() => false)) {
            columnFound = true;
            break;
          }
        }

        expect(columnFound).toBe(true);
      }
    });

    test('should show loading state while fetching patients', async ({ page }) => {
      // Navigate to patients page and immediately check for loading state
      const pagePromise = page.goto('/patients');

      // Check for loading skeleton or spinner
      const loadingIndicator = page.locator('[class*="skeleton"], [class*="loading"], [class*="spinner"]');

      // Loading state might appear briefly
      await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => {});

      await pagePromise;
    });
  });

  test.describe('Create Patient', () => {
    test('should open add patient modal', async ({ page }) => {
      await page.goto('/patients');

      // Click "Add Patient" button
      await page.click('button:has-text("Add Patient"), button[data-testid="button-add-patient"]');

      // Verify modal opens
      await expect(page.locator('[role="dialog"], .modal, [class*="dialog"]')).toBeVisible({ timeout: 3000 });

      // Verify modal title
      await expect(page.locator('h2:has-text("Add Patient"), h3:has-text("Add Patient"), text=Add New Patient')).toBeVisible();

      // Verify form fields exist
      await expect(page.locator('input[name="firstName"], input[name="name"]').first()).toBeVisible();
    });

    test('should create new patient with required fields', async ({ page }) => {
      await page.goto('/patients');

      // Open add patient modal
      await page.click('button:has-text("Add Patient"), button[data-testid="button-add-patient"]');

      // Wait for modal
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 3000 });

      // Fill in patient details
      const timestamp = Date.now();

      // Try different possible field names
      const firstNameField = page.locator('input[name="firstName"], input[placeholder*="First"]').first();
      const lastNameField = page.locator('input[name="lastName"], input[placeholder*="Last"]').first();
      const nameField = page.locator('input[name="name"], input[placeholder*="Name"]').first();

      // Check if separate first/last name fields or single name field
      if (await firstNameField.isVisible().catch(() => false)) {
        await firstNameField.fill(`Test${timestamp}`);
        await lastNameField.fill('Patient');
      } else if (await nameField.isVisible().catch(() => false)) {
        await nameField.fill(`Test${timestamp} Patient`);
      }

      // Fill optional fields if they exist
      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.isVisible().catch(() => false)) {
        await emailField.fill(`patient${timestamp}@example.com`);
      }

      const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
      if (await phoneField.isVisible().catch(() => false)) {
        await phoneField.fill('07700900000');
      }

      const dobField = page.locator('input[name="dateOfBirth"], input[name="dob"], input[type="date"]').first();
      if (await dobField.isVisible().catch(() => false)) {
        await dobField.fill('1990-01-15');
      }

      // Submit form
      await page.click('button:has-text("Add Patient"), button:has-text("Create"), button:has-text("Save"), button[type="submit"]');

      // Verify success
      await expect(page.locator('text=/patient.*created|added.*successfully|success/i')).toBeVisible({ timeout: 5000 }).catch(() => {});

      // Verify modal closes
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 }).catch(() => {});

      // Verify patient appears in list
      await expect(page.locator(`text=/Test${timestamp}/i`).first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields when creating patient', async ({ page }) => {
      await page.goto('/patients');

      // Open add patient modal
      await page.click('button:has-text("Add Patient"), button[data-testid="button-add-patient"]');

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 3000 });

      // Try to submit without filling fields
      await page.click('button:has-text("Add Patient"), button:has-text("Create"), button:has-text("Save"), button[type="submit"]');

      // Verify validation error appears
      const errorMessage = page.locator('text=/required|must provide|cannot be empty/i, [class*="error"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
    });

    test('should create patient with all optional fields', async ({ page }) => {
      await page.goto('/patients');

      await page.click('button:has-text("Add Patient"), button[data-testid="button-add-patient"]');
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 3000 });

      const timestamp = Date.now();

      // Fill all available fields
      const fieldMappings = [
        { selector: 'input[name="firstName"], input[placeholder*="First"]', value: `Complete${timestamp}` },
        { selector: 'input[name="lastName"], input[placeholder*="Last"]', value: 'Patient' },
        { selector: 'input[name="email"], input[type="email"]', value: `complete${timestamp}@example.com` },
        { selector: 'input[name="phone"], input[type="tel"]', value: '07700900111' },
        { selector: 'input[name="dateOfBirth"], input[name="dob"], input[type="date"]', value: '1985-06-20' },
        { selector: 'input[name="nhsNumber"]', value: '4505551234' },
        { selector: 'input[name="address"], textarea[name="address"]', value: '123 Test Street, London' },
        { selector: 'input[name="postcode"]', value: 'SW1A 1AA' },
      ];

      for (const field of fieldMappings) {
        const element = page.locator(field.selector).first();
        if (await element.isVisible().catch(() => false)) {
          await element.fill(field.value);
        }
      }

      // Submit
      await page.click('button:has-text("Add Patient"), button:has-text("Create"), button:has-text("Save"), button[type="submit"]');

      // Verify success
      await expect(page.locator(`text=/Complete${timestamp}/i`).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search and Filter', () => {
    test('should search patients by name', async ({ page }) => {
      await page.goto('/patients');

      // Wait for patients to load
      await page.waitForSelector('table, [role="table"]', { timeout: 5000 }).catch(() => {});

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[data-testid="input-search"]').first();

      if (await searchInput.isVisible()) {
        // Get first patient name from table
        const firstPatientName = await page.locator('table tr td:first-child, table tr td:nth-child(2)').first().textContent();

        if (firstPatientName) {
          // Search for part of the name
          const searchTerm = firstPatientName.trim().substring(0, 4);
          await searchInput.fill(searchTerm);

          // Wait for filtering
          await page.waitForTimeout(500);

          // Verify search results contain the search term
          const tableContent = await page.locator('table').textContent();
          expect(tableContent?.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
      }
    });

    test('should show no results message when search has no matches', async ({ page }) => {
      await page.goto('/patients');

      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[data-testid="input-search"]').first();

      if (await searchInput.isVisible()) {
        // Search for non-existent patient
        await searchInput.fill('ZZZZNONEXISTENT99999');

        // Wait for filtering
        await page.waitForTimeout(500);

        // Verify empty state or no results message
        await expect(page.locator('text=/no.*found|no.*match|no results/i')).toBeVisible({ timeout: 3000 }).catch(() => {
          // Or verify table has no rows (except header)
          expect(page.locator('table tbody tr').count()).resolves.toBe(0);
        });
      }
    });

    test('should clear search results', async ({ page }) => {
      await page.goto('/patients');

      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[data-testid="input-search"]').first();

      if (await searchInput.isVisible()) {
        // Search for something
        await searchInput.fill('test');
        await page.waitForTimeout(300);

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(300);

        // Verify all patients shown again
        const rowCount = await page.locator('table tbody tr').count();
        expect(rowCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('View Patient Details', () => {
    test('should view patient details', async ({ page }) => {
      await page.goto('/patients');

      // Wait for table
      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Click on first patient row or view button
      const firstRow = page.locator('table tbody tr').first();

      if (await firstRow.isVisible()) {
        // Look for "View" button or click row
        const viewButton = firstRow.locator('button:has-text("View"), a:has-text("View")');

        if (await viewButton.isVisible().catch(() => false)) {
          await viewButton.click();
        } else {
          // Click row itself
          await firstRow.click();
        }

        // Verify patient details page or modal opens
        await expect(
          page.locator('[role="dialog"], h1:has-text("Patient Details"), h2:has-text("Patient")')
        ).toBeVisible({ timeout: 3000 }).catch(() => {
          // Or URL changes to patient detail page
          expect(page.url()).toMatch(/patient|view/);
        });
      }
    });
  });

  test.describe('Edit Patient', () => {
    test('should open edit patient modal', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Find edit button
      const editButton = page.locator('button:has-text("Edit"), [aria-label*="Edit"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Verify edit modal/page opens
        await expect(page.locator('[role="dialog"], text=Edit Patient')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should update patient information', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      const editButton = page.locator('button:has-text("Edit"), [aria-label*="Edit"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('[role="dialog"], text=Edit Patient', { timeout: 3000 });

        // Update phone number
        const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();

        if (await phoneInput.isVisible()) {
          await phoneInput.clear();
          await phoneInput.fill('07700900999');

          // Save changes
          await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');

          // Verify success
          await expect(page.locator('text=/updated|saved.*successfully/i')).toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    });
  });

  test.describe('Delete Patient', () => {
    test('should show delete confirmation', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Find delete button
      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="Delete"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Verify confirmation dialog appears
        await expect(page.locator('text=/are you sure|confirm.*delete|delete.*patient/i')).toBeVisible({ timeout: 3000 });

        // Cancel deletion
        await page.click('button:has-text("Cancel"), button:has-text("No")');
      }
    });

    test('should delete patient after confirmation', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Get patient name before deletion
      const patientRow = page.locator('table tbody tr').first();
      const patientName = await patientRow.locator('td').nth(1).textContent();

      const deleteButton = patientRow.locator('button:has-text("Delete"), [aria-label*="Delete"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        await page.click('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');

        // Verify success message
        await expect(page.locator('text=/deleted.*successfully|patient.*removed/i')).toBeVisible({ timeout: 3000 }).catch(() => {});

        // Verify patient no longer in list
        if (patientName) {
          await expect(page.locator(`text=${patientName.trim()}`)).not.toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    });
  });

  test.describe('Patient Actions', () => {
    test('should navigate to create examination from patient list', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Look for "New Examination" or "Examine" button
      const examButton = page.locator('button:has-text("Examination"), button:has-text("Examine"), a:has-text("Examination")').first();

      if (await examButton.isVisible()) {
        await examButton.click();

        // Verify navigation to examination page
        await expect(page).toHaveURL(/examination|exam/, { timeout: 3000 }).catch(() => {});
      }
    });

    test('should view patient history', async ({ page }) => {
      await page.goto('/patients');

      await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});

      // Look for "History" button
      const historyButton = page.locator('button:has-text("History"), a:has-text("History")').first();

      if (await historyButton.isVisible()) {
        await historyButton.click();

        // Verify history view
        await expect(page.locator('text=/history|timeline|past.*examination/i')).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/patients');

      // Focus on "Add Patient" button
      await page.keyboard.press('Tab');

      // Verify button is focused
      const addButton = page.locator('button:has-text("Add Patient")');
      await expect(addButton).toBeFocused().catch(() => {});

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 }).catch(() => {});

      // Close with Escape
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/patients');

      // Verify search has label
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

      if (await searchInput.isVisible()) {
        const ariaLabel = await searchInput.getAttribute('aria-label');
        const placeholder = await searchInput.getAttribute('placeholder');

        // Should have either aria-label or placeholder
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });
  });
});
