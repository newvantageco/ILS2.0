"""
Database utility module for Python Analytics Service

Provides database connection management and query execution
for analytics and ML endpoints.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import List, Dict, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseConnection:
    """
    Manages database connections for analytics queries.
    """

    def __init__(self, connection_string: Optional[str] = None):
        """
        Initialize database connection manager.

        Args:
            connection_string: PostgreSQL connection string.
                             If None, reads from DATABASE_URL environment variable.
        """
        self.connection_string = connection_string or os.getenv("DATABASE_URL")

        if not self.connection_string:
            logger.warning("No DATABASE_URL configured. Using fallback mode.")
            self.connection_string = None

    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections.

        Yields:
            Database connection with automatic cleanup
        """
        if not self.connection_string:
            raise ValueError("Database connection not configured. Set DATABASE_URL environment variable.")

        conn = None
        try:
            conn = psycopg2.connect(self.connection_string)
            yield conn
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results as list of dictionaries.

        Args:
            query: SQL query string
            params: Query parameters (optional)

        Returns:
            List of rows as dictionaries
        """
        if not self.connection_string:
            logger.warning("Database not configured. Returning empty result.")
            return []

        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return []

    def execute_scalar(self, query: str, params: tuple = None) -> Any:
        """
        Execute a query and return a single scalar value.

        Args:
            query: SQL query string
            params: Query parameters (optional)

        Returns:
            Single value
        """
        if not self.connection_string:
            logger.warning("Database not configured. Returning None.")
            return None

        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchone()
                    return result[0] if result else None
        except Exception as e:
            logger.error(f"Scalar query failed: {e}")
            return None

    def is_configured(self) -> bool:
        """
        Check if database is properly configured.

        Returns:
            True if database connection is configured
        """
        return self.connection_string is not None


# Global database instance
db = DatabaseConnection()


def get_order_trends_from_db(days: int = 30) -> Dict[str, Any]:
    """
    Fetch order trends from database.

    Args:
        days: Number of days to analyze

    Returns:
        Order trends data
    """
    if not db.is_configured():
        logger.warning("Database not configured. Returning example data.")
        return None

    try:
        # Query to get order counts and trends
        query = """
            SELECT
                DATE(created_at) as order_date,
                COUNT(*) as order_count,
                SUM(total_amount) as daily_revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '%s days'
            GROUP BY DATE(created_at)
            ORDER BY order_date DESC
        """

        results = db.execute_query(query, (days,))

        if not results:
            return None

        # Calculate totals
        total_orders = sum(row['order_count'] for row in results)
        total_revenue = sum(row['daily_revenue'] or 0 for row in results)
        avg_per_day = total_orders / max(len(results), 1)

        # Get lens type breakdown
        lens_query = """
            SELECT
                lens_type,
                COUNT(*) as count
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '%s days'
            GROUP BY lens_type
            ORDER BY count DESC
        """

        lens_results = db.execute_query(lens_query, (days,))

        return {
            "period_days": days,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue) if total_revenue else 0,
            "average_per_day": round(avg_per_day, 2),
            "trend": "stable",  # Could be calculated from time series
            "top_lens_types": [
                {"type": row['lens_type'], "count": row['count']}
                for row in lens_results[:5]
            ],
            "daily_data": [
                {
                    "date": str(row['order_date']),
                    "orders": row['order_count'],
                    "revenue": float(row['daily_revenue'] or 0)
                }
                for row in results
            ]
        }

    except Exception as e:
        logger.error(f"Failed to fetch order trends: {e}")
        return None


def get_batch_report_from_db(order_ids: List[str]) -> Optional[Dict[str, Any]]:
    """
    Generate batch report from database.

    Args:
        order_ids: List of order IDs to include

    Returns:
        Batch report data
    """
    if not db.is_configured() or not order_ids:
        return None

    try:
        # Build query with proper parameterization
        placeholders = ','.join(['%s'] * len(order_ids))
        query = f"""
            SELECT
                id,
                status,
                lens_type,
                total_amount,
                created_at,
                completed_at
            FROM orders
            WHERE id IN ({placeholders})
        """

        results = db.execute_query(query, tuple(order_ids))

        if not results:
            return None

        # Calculate summary statistics
        total_revenue = sum(row['total_amount'] or 0 for row in results)
        avg_order_value = total_revenue / len(results) if results else 0

        completed = [r for r in results if r['status'] == 'completed']
        completion_rate = len(completed) / len(results) if results else 0

        # Lens type breakdown
        lens_breakdown = {}
        for row in results:
            lens_type = row['lens_type'] or 'unknown'
            lens_breakdown[lens_type] = lens_breakdown.get(lens_type, 0) + 1

        # Status breakdown
        status_breakdown = {}
        for row in results:
            status = row['status'] or 'unknown'
            status_breakdown[status] = status_breakdown.get(status, 0) + 1

        return {
            "total_orders": len(results),
            "order_ids": order_ids,
            "summary": {
                "total_revenue": float(total_revenue),
                "average_order_value": float(avg_order_value),
                "completion_rate": completion_rate
            },
            "breakdown_by_lens_type": lens_breakdown,
            "breakdown_by_status": status_breakdown
        }

    except Exception as e:
        logger.error(f"Failed to generate batch report: {e}")
        return None
