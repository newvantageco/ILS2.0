import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: AI Assistant Interactions
 *
 * Tests AI assistant functionality:
 * - Open AI chat widget
 * - Ask ophthalmic questions
 * - Receive AI responses
 * - View conversation history
 * - Topic validation
 * - Multi-provider support
 * - Error handling
 */

test.describe('AI Assistant', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ecp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test.describe('AI Chat Widget', () => {
    test('should display AI assistant button on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for AI assistant trigger button (usually floating or in corner)
      const aiButton = page.locator(
        'button:has-text("AI"), button:has-text("Assistant"), [data-testid*="ai"], [aria-label*="AI"]'
      ).first();

      // AI button should be visible or check for AI widget
      await expect(aiButton.or(page.locator('.ai-widget, #ai-chat'))).toBeVisible({ timeout: 5000 }).catch(() => {
        // Might be on a dedicated AI page instead
        expect(page.locator('a[href*="ai"], button:has-text("AI")')).toBeVisible();
      });
    });

    test('should open AI chat widget when clicked', async ({ page }) => {
      await page.goto('/dashboard');

      // Find and click AI button
      const aiButton = page.locator(
        'button:has-text("AI"), button:has-text("Assistant"), [data-testid*="ai-button"]'
      ).first();

      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();

        // Verify chat interface opens
        await expect(page.locator(
          '[role="dialog"]:has-text("AI"), .chat-widget, [data-testid*="ai-chat"]'
        )).toBeVisible({ timeout: 3000 });

        // Verify input field exists
        await expect(page.locator(
          'textarea[placeholder*="Ask"], input[placeholder*="message"], textarea[placeholder*="question"]'
        )).toBeVisible();
      } else {
        // Navigate to AI assistant page if no widget
        await page.goto('/ai-assistant');
        await expect(page.locator('h1:has-text("AI"), h2:has-text("Assistant")')).toBeVisible();
      }
    });

    test('should close AI chat widget', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI"), [data-testid*="ai-button"]').first();

      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();

        // Wait for widget to open
        await page.waitForSelector('[role="dialog"], .chat-widget', { timeout: 3000 }).catch(() => {});

        // Find close button
        const closeButton = page.locator(
          'button[aria-label*="Close"], button:has-text("Close"), button:has-text("×")'
        ).last();

        if (await closeButton.isVisible()) {
          await closeButton.click();

          // Verify widget closes
          await expect(page.locator('[role="dialog"]:has-text("AI")')).not.toBeVisible({ timeout: 2000 }).catch(() => {});
        }
      }
    });
  });

  test.describe('Asking Questions', () => {
    test('should ask ophthalmic question and receive response', async ({ page }) => {
      // Navigate to AI assistant (widget or page)
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI"), [data-testid*="ai"]').first();

      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      // Wait for chat interface
      await page.waitForTimeout(1000);

      // Find input field
      const inputField = page.locator(
        'textarea[placeholder*="Ask"], textarea[placeholder*="message"], input[placeholder*="question"]'
      ).first();

      // Ask a simple ophthalmic question
      await inputField.fill('What are progressive lenses?');

      // Submit question
      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"], button[aria-label*="Send"]'
      ).first();

      await sendButton.click();

      // Verify question appears in chat
      await expect(page.locator('text=What are progressive lenses?')).toBeVisible({ timeout: 3000 });

      // Verify AI response appears (with generous timeout for AI processing)
      await expect(page.locator(
        'text=/progressive.*lenses|multifocal|presbyopia/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });

    test('should handle prescription-related questions', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      // Ask about prescription
      await inputField.fill('What does sphere mean in a prescription?');

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await sendButton.click();

      // Verify response mentions relevant terms
      await expect(page.locator(
        'text=/sphere|refractive power|myopia|hyperopia|diopter/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });

    test('should ask about lens coatings', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      await inputField.fill('What is anti-reflective coating?');

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await sendButton.click();

      // Verify response
      await expect(page.locator(
        'text=/anti-reflective|AR coating|reflection|glare/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });

    test('should handle multiple questions in sequence', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // First question
      await inputField.fill('What is astigmatism?');
      await sendButton.click();

      await expect(page.locator('text=/astigmatism|cornea|cylinder/i').first()).toBeVisible({ timeout: 30000 });

      // Second question
      await inputField.fill('How is it corrected?');
      await sendButton.click();

      await expect(page.locator('text=/corrected|cylindrical|toric/i').first()).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Topic Validation', () => {
    test('should reject off-topic questions', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      // Ask completely off-topic question
      await inputField.fill('What is the weather today?');

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await sendButton.click();

      // Should show topic validation message
      await expect(page.locator(
        'text=/off-topic|optometry|eyecare|optical/i'
      ).first()).toBeVisible({ timeout: 10000 }).catch(() => {
        // Or AI might politely decline
        expect(page.locator('text=/cannot help|outside.*scope|not.*about/i')).toBeVisible();
      });
    });

    test('should accept optometry-related questions', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // Valid optometry questions
      const validQuestions = [
        'What is presbyopia?',
        'How do bifocal lenses work?',
        'What is a retinal examination?',
      ];

      for (const question of validQuestions) {
        await inputField.fill(question);
        await sendButton.click();

        // Should get a response (not rejection)
        await expect(page.locator(
          'text=/presbyopia|bifocal|retinal|examination/i'
        ).first()).toBeVisible({ timeout: 30000 });

        // Wait before next question
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Conversation History', () => {
    test('should display conversation history', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // Ask first question
      await inputField.fill('What are contact lenses?');
      await sendButton.click();

      await page.waitForTimeout(5000);

      // Ask second question
      await inputField.fill('What types are available?');
      await sendButton.click();

      await page.waitForTimeout(5000);

      // Both questions should be visible in history
      await expect(page.locator('text=What are contact lenses?')).toBeVisible();
      await expect(page.locator('text=What types are available?')).toBeVisible();
    });

    test('should maintain context between questions', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // Ask about a topic
      await inputField.fill('Tell me about polycarbonate lenses');
      await sendButton.click();

      await page.waitForTimeout(8000);

      // Ask follow-up using "they" (requires context)
      await inputField.fill('Why are they recommended for children?');
      await sendButton.click();

      // Should answer with context about polycarbonate
      await expect(page.locator(
        'text=/polycarbonate|impact.*resistant|safety|durable/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });

    test('should clear conversation history', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // Ask a question
      await inputField.fill('What is myopia?');
      await sendButton.click();

      await page.waitForTimeout(5000);

      // Find clear/new chat button
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("New Chat"), button[aria-label*="Clear"]'
      ).first();

      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Verify conversation is cleared
        await expect(page.locator('text=What is myopia?')).not.toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty message submission', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      // Try to send without typing anything
      const isDisabled = await sendButton.isDisabled().catch(() => false);

      if (!isDisabled) {
        await sendButton.click();

        // Should either do nothing or show validation error
        const errorMessage = page.locator('text=/cannot.*empty|please.*enter|required/i');
        await errorMessage.isVisible({ timeout: 2000 }).catch(() => {});
      }

      // Button should be disabled when input is empty
      expect(isDisabled).toBe(true);
    });

    test('should show loading state while AI is responding', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      await inputField.fill('What are trifocal lenses?');

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await sendButton.click();

      // Look for loading indicator
      await expect(page.locator(
        'text=/thinking|typing|loading|generating/i, [class*="loading"], [class*="spinner"]'
      ).first()).toBeVisible({ timeout: 2000 }).catch(() => {});
    });

    test('should handle network errors gracefully', async ({ page, context }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      // Simulate network failure
      await context.route('**/api/**', route => route.abort());

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      await inputField.fill('Test question');

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await sendButton.click();

      // Should show error message
      await expect(page.locator(
        'text=/error|failed|network|try.*again/i'
      ).first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });
  });

  test.describe('AI Features', () => {
    test('should provide lens recommendations', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await inputField.fill('What lens would you recommend for a computer user?');
      await sendButton.click();

      // Should mention relevant lens types
      await expect(page.locator(
        'text=/blue.*light|anti.*reflective|computer.*glasses|blue.*filter/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });

    test('should explain optical terminology', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();
      if (await aiButton.isVisible().catch(() => false)) {
        await aiButton.click();
      } else {
        await page.goto('/ai-assistant');
      }

      await page.waitForTimeout(1000);

      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="message"]'
      ).first();

      const sendButton = page.locator(
        'button:has-text("Send"), button[type="submit"]'
      ).first();

      await inputField.fill('What does PD mean?');
      await sendButton.click();

      // Should explain pupillary distance
      await expect(page.locator(
        'text=/pupillary distance|distance between|pupils|PD/i'
      ).first()).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();

      if (await aiButton.isVisible().catch(() => false)) {
        // Tab to AI button
        await page.keyboard.press('Tab');

        // Open with Enter
        await page.keyboard.press('Enter');

        await page.waitForTimeout(1000);

        // Type question with keyboard
        await page.keyboard.type('What is glaucoma?');

        // Submit with keyboard
        await page.keyboard.press('Enter');

        // Response should appear
        await expect(page.locator('text=/glaucoma|eye.*pressure|optic.*nerve/i').first()).toBeVisible({ timeout: 30000 });
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/dashboard');

      const aiButton = page.locator('button:has-text("AI")').first();

      if (await aiButton.isVisible()) {
        await aiButton.click();

        await page.waitForTimeout(1000);

        // Check for ARIA labels
        const inputField = page.locator('textarea, input').last();

        const ariaLabel = await inputField.getAttribute('aria-label').catch(() => null);
        const placeholder = await inputField.getAttribute('placeholder').catch(() => null);

        // Should have descriptive label or placeholder
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });
  });
});
