import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import logger from '../utils/logger';


/**
 * Middleware factory to validate request body against a Zod schema
 * Enforces strict input validation at API boundaries
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      const validatedData = schema.parse(req.body);
      
      // Replace req.body with validated data (ensures type safety downstream)
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod errors to human-readable format
        const validationError = fromZodError(error);
        res.status(400).json({
          error: "Validation failed",
          message: validationError.message,
          details: error.errors,
        });
        return;
      }
      
      // Unexpected error during validation
      res.status(500).json({
        error: "Internal server error during validation",
      });
      return;
    }
  };
}

/**
 * Middleware factory to validate request query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          error: "Query validation failed",
          message: validationError.message,
          details: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        error: "Internal server error during validation",
      });
      return;
    }
  };
}

/**
 * Middleware factory to validate request params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          error: "Parameter validation failed",
          message: validationError.message,
          details: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        error: "Internal server error during validation",
      });
      return;
    }
  };
}

/**
 * Utility to validate and parse database output against a Zod schema
 * Use this to ensure data fetched from the database matches expected types
 */
export function validateDatabaseOutput<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error("Database output validation failed:", fromZodError(error).message);
      throw new Error("Data integrity error: Database returned invalid data");
    }
    throw error;
  }
}

/**
 * Utility to safely validate array results from database
 */
export function validateDatabaseArray<T>(schema: ZodSchema<T>, data: unknown[]): T[] {
  return data.map((item, index) => {
    try {
      return schema.parse(item);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(`Database array validation failed at index ${index}:`, fromZodError(error).message);
        throw new Error(`Data integrity error at record ${index}: Database returned invalid data`);
      }
      throw error;
    }
  });
}
