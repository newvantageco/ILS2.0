/**
 * Delete Test ECP Account
 */

import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('delete-test-ecp');

router.post('/delete-test-ecp', async (req: Request, res: Response) => {
  try {
    const email = 'test.ecp@ils2.com';

    // Get user and company
    const userResult = await pool.query(
      'SELECT id, company_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'User already deleted or does not exist'
      });
    }

    const user = userResult.rows[0];
    const userId = user.id;
    const companyId = user.company_id;

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    logger.info({ userId, email }, 'User deleted');

    // Delete company if it exists and has no other users
    if (companyId) {
      const otherUsers = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE company_id = $1',
        [companyId]
      );

      if (parseInt(otherUsers.rows[0].count) === 0) {
        await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
        logger.info({ companyId }, 'Company deleted (no remaining users)');
      }
    }

    logger.info({ email }, 'Test ECP account deleted successfully');

    return res.json({
      success: true,
      message: 'Test ECP account and company deleted successfully',
      deletedUser: email
    });
  } catch (error) {
    logger.error({ error }, 'Failed to delete test ECP');
    return res.status(500).json({
      success: false,
      error: 'Failed to delete test ECP account',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
