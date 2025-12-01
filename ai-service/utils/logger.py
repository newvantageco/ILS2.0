"""
Logging configuration using loguru
"""

import sys
import os
from loguru import logger

# Get settings from environment
log_level = os.getenv("LOG_LEVEL", "INFO").upper()  # Ensure uppercase for loguru
log_json = os.getenv("LOG_JSON", "true").lower() == "true"

# Remove default handler
logger.remove()

# Add custom handler with appropriate format
if log_json:
    # JSON format for production
    logger.add(
        sys.stdout,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        level=log_level,
        serialize=True,
    )
else:
    # Human-readable format for development
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
        level=log_level,
        colorize=True,
    )

# Export logger
__all__ = ["logger"]
