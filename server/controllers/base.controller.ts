/**
 * Base Controller
 * 
 * Provides common functionality for all controllers including
 * error handling, validation, and response formatting.
 */

import { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import logger from "../utils/logger";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";

// Define the actual user structure used in the codebase based on existing routes.ts usage
interface ClaimsBasedUser {
  claims?: {
    sub?: string;
    email?: string;
    role?: string;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Extended interface that matches the actual usage pattern in the codebase
export interface ExtendedAuthenticatedRequest extends Omit<AuthenticatedRequest, 'user'> {
  user?: ClaimsBasedUser;
}

export interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export class BaseController {
  /**
   * Send a successful response
   */
  protected success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ControllerResponse<T> = {
      success: true,
      data,
      message,
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   */
  protected error(res: Response, message: string, statusCode: number = 500, error?: string): void {
    const response: ControllerResponse = {
      success: false,
      message,
      error,
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send validation errors
   */
  protected validationError(res: Response, errors: Record<string, string[]>, message: string = "Validation failed"): void {
    const response: ControllerResponse = {
      success: false,
      message,
      errors,
    };
    
    res.status(400).json(response);
  }

  /**
   * Handle Zod validation errors
   */
  protected handleZodError(error: ZodError, res: Response): void {
    const formattedErrors: Record<string, string[]> = {};
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(err.message);
    });

    this.validationError(res, formattedErrors, fromZodError(error).message);
  }

  /**
   * Get authenticated user with validation
   */
  protected getAuthenticatedUser(req: ExtendedAuthenticatedRequest) {
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    return { userId, user: req.user };
  }

  /**
   * Log controller actions
   */
  protected logAction(action: string, userId: string, details?: any): void {
    logger.info({
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    }, `Controller action: ${action}`);
  }

  /**
   * Log controller errors
   */
  protected logError(action: string, error: Error, userId?: string, details?: any): void {
    logger.error({
      action,
      error: error.message,
      stack: error.stack,
      userId,
      details,
      timestamp: new Date().toISOString(),
    }, `Controller error: ${action}`);
  }

  /**
   * Async handler wrapper for consistent error handling
   */
  protected asyncHandler<T>(
    fn: (req: ExtendedAuthenticatedRequest, res: Response) => Promise<T>
  ) {
    return async (req: AuthenticatedRequest, res: Response) => {
      try {
        return await fn(req as ExtendedAuthenticatedRequest, res);
      } catch (error) {
        if (error instanceof ZodError) {
          this.handleZodError(error, res);
        } else if (error instanceof Error) {
          this.logError("async_handler", error, req.user?.id);
          this.error(res, error.message, 500);
        } else {
          this.logError("async_handler", new Error(String(error)), req.user?.id);
          this.error(res, "An unexpected error occurred", 500);
        }
      }
    };
  }
}
