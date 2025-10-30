import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Registration and Approval Flow
 * 
 * This test covers the complete user registration and admin approval process:
 * 1. New ECP registers an account
 * 2. Admin logs in and approves the user
 * 3. ECP receives approval and can log in
 */

test.describe('User Registration and Approval', () => {
  const newEcpEmail = `test-ecp-${Date.now()}@example.com`;
  const newEcpPassword = 'SecurePassword123!';
  
  test('Admin can approve new user registration', async ({ page, context }) => {
    // Step 1: Register new ECP account
    await page.goto('/register');
    
    await page.fill('input[name="email"]', newEcpEmail);
    await page.fill('input[name="password"]', newEcpPassword);
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="organizationName"]', 'Test Optical Practice');
    await page.selectOption('select[name="role"]', 'ecp');
    
    await page.click('button[type="submit"]');
    
    // Verify registration success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
    await expect(page.locator('text=pending approval')).toBeVisible();
    
    // Step 2: Admin logs in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@ils.com');
    await page.fill('input[name="password"]', 'admin_password');
    await page.click('button[type="submit"]');
    
    // Verify admin dashboard is visible
    await expect(page).toHaveURL(/.*admin/);
    
    // Step 3: Navigate to user management
    await page.click('text=User Management');
    
    // Find the pending user
    const pendingUserRow = page.locator(`tr:has-text("${newEcpEmail}")`);
    await expect(pendingUserRow).toBeVisible();
    await expect(pendingUserRow.locator('text=Pending')).toBeVisible();
    
    // Approve the user
    await pendingUserRow.locator('button:has-text("Approve")').click();
    
    // Verify approval confirmation
    await expect(page.locator('text=User approved successfully')).toBeVisible();
    await expect(pendingUserRow.locator('text=Active')).toBeVisible();
    
    // Step 4: Logout admin
    await page.click('button:has-text("Logout")');
    
    // Step 5: ECP logs in with new account
    await page.goto('/login');
    await page.fill('input[name="email"]', newEcpEmail);
    await page.fill('input[name="password"]', newEcpPassword);
    await page.click('button[type="submit"]');
    
    // Verify ECP dashboard is accessible
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome, John')).toBeVisible();
  });
});

/**
 * E2E Test: ECP Creates Complete Order
 * 
 * The "Golden Path" - Full order creation workflow:
 * 1. ECP logs in
 * 2. Creates new patient
 * 3. Fills out prescription
 * 4. Uploads OMA file
 * 5. Submits order
 * 6. Verifies order appears in dashboard
 */
test.describe('ECP Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as ECP
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ecp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('ECP can create complete order with OMA file', async ({ page }) => {
    // Step 1: Navigate to new order
    await page.click('text=New Order');
    await expect(page).toHaveURL(/.*orders\/new/);
    
    // Step 2: Fill patient information
    await page.fill('input[name="patientName"]', 'Alice Johnson');
    await page.fill('input[name="patientDOB"]', '1985-03-15');
    await page.fill('input[name="patientEmail"]', 'alice.johnson@example.com');
    
    await page.click('button:has-text("Next")');
    
    // Step 3: Fill prescription data
    // Right eye (OD)
    await page.fill('input[name="odSphere"]', '+2.00');
    await page.fill('input[name="odCylinder"]', '-0.50');
    await page.fill('input[name="odAxis"]', '90');
    await page.fill('input[name="odAdd"]', '+1.50');
    
    // Left eye (OS)
    await page.fill('input[name="osSphere"]', '+2.25');
    await page.fill('input[name="osCylinder"]', '-0.75');
    await page.fill('input[name="osAxis"]', '85');
    await page.fill('input[name="osAdd"]', '+1.50');
    
    // PD
    await page.fill('input[name="pd"]', '64');
    
    await page.click('button:has-text("Next")');
    
    // Step 4: Select lens specifications
    await page.selectOption('select[name="lensType"]', 'progressive');
    await page.selectOption('select[name="lensMaterial"]', 'polycarbonate');
    await page.selectOption('select[name="coating"]', 'anti-reflective');
    
    await page.click('button:has-text("Next")');
    
    // Step 5: Upload OMA file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test/fixtures/sample.oma');
    
    // Wait for file processing
    await expect(page.locator('text=Frame tracing preview')).toBeVisible({ timeout: 10000 });
    
    // Verify visualization appears
    await expect(page.locator('canvas')).toBeVisible();
    
    // Step 6: Add notes and submit
    await page.fill('textarea[name="notes"]', 'Patient requires rush processing');
    await page.click('button:has-text("Submit Order")');
    
    // Step 7: Verify success
    await expect(page.locator('text=Order created successfully')).toBeVisible();
    await expect(page).toHaveURL(/.*orders/);
    
    // Step 8: Verify order appears in list
    const orderRow = page.locator('tr:has-text("Alice Johnson")').first();
    await expect(orderRow).toBeVisible();
    await expect(orderRow.locator('text=Submitted')).toBeVisible();
    
    // Verify order number is generated
    const orderNumber = await orderRow.locator('td').first().textContent();
    expect(orderNumber).toMatch(/ORD-\d+/);
  });

  test('Order form validates required fields', async ({ page }) => {
    await page.click('text=New Order');
    
    // Try to submit without filling anything
    await page.click('button:has-text("Submit Order")');
    
    // Verify validation errors appear
    await expect(page.locator('text=Patient name is required')).toBeVisible();
    await expect(page.locator('text=Lens type is required')).toBeVisible();
  });
});

/**
 * E2E Test: Lab Tech Manages Production Queue
 * 
 * Lab technician workflow:
 * 1. Lab tech logs in
 * 2. Views production queue
 * 3. Changes order status
 * 4. Adds production notes
 */
test.describe('Lab Tech Production Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as lab tech
    await page.goto('/login');
    await page.fill('input[name="email"]', 'labtech@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Lab tech can manage order status', async ({ page }) => {
    // Step 1: Navigate to production queue
    await page.click('text=Production Queue');
    await expect(page).toHaveURL(/.*production/);
    
    // Step 2: Find submitted order
    const submittedOrder = page.locator('tr:has-text("Submitted")').first();
    await expect(submittedOrder).toBeVisible();
    
    // Step 3: View order details
    await submittedOrder.click();
    
    // Step 4: Change status to "In Production"
    await page.click('button:has-text("Start Production")');
    
    // Confirm status change
    await page.click('button:has-text("Confirm")');
    
    // Step 5: Verify status updated
    await expect(page.locator('text=In Production')).toBeVisible();
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
    
    // Step 6: Add production notes
    await page.fill('textarea[name="notes"]', 'Started processing with machine #3');
    await page.click('button:has-text("Save Notes")');
    
    await expect(page.locator('text=Notes saved')).toBeVisible();
  });

  test('Lab tech can view order history', async ({ page }) => {
    await page.click('text=Production Queue');
    
    // Open an order
    await page.locator('tr').first().click();
    
    // View timeline
    await page.click('text=Order Timeline');
    
    // Verify timeline entries
    await expect(page.locator('text=Order created')).toBeVisible();
    await expect(page.locator('text=Status changed')).toBeVisible();
  });
});

/**
 * E2E Test: Complete Order Lifecycle
 * 
 * End-to-end test covering the full order lifecycle from creation to completion
 */
test.describe('Complete Order Lifecycle', () => {
  test('Full order flow from creation to completion', async ({ page }) => {
    // Create order as ECP
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ecp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Create new order (abbreviated)
    await page.click('text=New Order');
    await page.fill('input[name="patientName"]', 'Bob Smith');
    await page.fill('input[name="odSphere"]', '+1.50');
    await page.selectOption('select[name="lensType"]', 'single_vision');
    await page.selectOption('select[name="lensMaterial"]', 'cr39');
    await page.selectOption('select[name="coating"]', 'hard_coat');
    await page.click('button:has-text("Submit Order")');
    
    // Capture order number
    const orderNumber = await page.locator('td:has-text("ORD-")').first().textContent();
    
    // Logout ECP
    await page.click('button:has-text("Logout")');
    
    // Login as lab tech
    await page.goto('/login');
    await page.fill('input[name="email"]', 'labtech@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Find and process order
    await page.click('text=Production Queue');
    await page.locator(`tr:has-text("${orderNumber}")`).click();
    await page.click('button:has-text("Start Production")');
    await page.click('button:has-text("Confirm")');
    
    // Move to quality check
    await page.click('button:has-text("Quality Check")');
    await page.click('button:has-text("Confirm")');
    
    // Complete and ship
    await page.click('button:has-text("Mark as Shipped")');
    await page.fill('input[name="trackingNumber"]', 'TRACK123456');
    await page.click('button:has-text("Confirm")');
    
    // Verify completion
    await expect(page.locator('text=Order shipped successfully')).toBeVisible();
    await expect(page.locator('text=Shipped')).toBeVisible();
  });
});
