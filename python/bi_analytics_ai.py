"""
Business Intelligence AI Analytics Engine

This module uses advanced Python data science libraries to:
1. Analyze sales trends and predict future performance
2. Identify popular and underperforming inventory items
3. Optimize booking schedules and identify capacity issues
4. Generate actionable recommendations for tenant companies
5. Provide platform-level insights across all tenants

Dependencies: pandas, numpy, scikit-learn, scipy
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json
import sys


class BIAnalyticsAI:
    """
    AI-powered analytics engine for business intelligence insights.
    Uses statistical analysis and machine learning to generate recommendations.
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        
    def analyze_sales_trends(self, sales_data: List[Dict]) -> Dict[str, Any]:
        """
        Analyze sales trends and predict future performance.
        
        Args:
            sales_data: List of daily sales records with date, revenue, transactions
            
        Returns:
            Dictionary with trend analysis, predictions, and recommendations
        """
        if not sales_data or len(sales_data) < 7:
            return {
                "status": "insufficient_data",
                "message": "Need at least 7 days of data for analysis",
                "predictions": []
            }
        
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Calculate moving averages
        df['revenue_ma_7'] = df['revenue'].rolling(window=7, min_periods=1).mean()
        df['revenue_ma_30'] = df['revenue'].rolling(window=30, min_periods=1).mean()
        
        # Calculate trend using linear regression
        X = np.arange(len(df)).reshape(-1, 1)
        y = df['revenue'].values
        
        model = LinearRegression()
        model.fit(X, y)
        trend_slope = model.coef_[0]
        
        # Predict next 7 days
        future_X = np.arange(len(df), len(df) + 7).reshape(-1, 1)
        predictions = model.predict(future_X)
        
        # Calculate volatility
        volatility = df['revenue'].std() / df['revenue'].mean() if df['revenue'].mean() > 0 else 0
        
        # Detect seasonality (day of week patterns)
        df['day_of_week'] = df['date'].dt.dayofweek
        day_patterns = df.groupby('day_of_week')['revenue'].mean().to_dict()
        best_day = max(day_patterns, key=day_patterns.get)
        worst_day = min(day_patterns, key=day_patterns.get)
        
        # Generate insights
        insights = []
        
        if trend_slope > 0:
            growth_rate = (trend_slope / df['revenue'].mean()) * 100 if df['revenue'].mean() > 0 else 0
            insights.append({
                "type": "positive",
                "title": "Positive Revenue Trend",
                "message": f"Sales are growing at {growth_rate:.1f}% per day on average",
                "recommendation": "Maintain current strategies and consider scaling marketing efforts"
            })
        elif trend_slope < 0:
            decline_rate = abs((trend_slope / df['revenue'].mean()) * 100) if df['revenue'].mean() > 0 else 0
            insights.append({
                "type": "warning",
                "title": "Declining Revenue Trend",
                "message": f"Sales declining at {decline_rate:.1f}% per day",
                "recommendation": "Review pricing, promotions, and customer retention strategies immediately"
            })
        
        if volatility > 0.3:
            insights.append({
                "type": "warning",
                "title": "High Revenue Volatility",
                "message": f"Revenue fluctuates by {volatility*100:.1f}% on average",
                "recommendation": "Implement consistent pricing and booking policies to stabilize revenue"
            })
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        insights.append({
            "type": "info",
            "title": "Day-of-Week Patterns",
            "message": f"Best day: {day_names[best_day]} (${day_patterns[best_day]:.0f}), Worst: {day_names[worst_day]} (${day_patterns[worst_day]:.0f})",
            "recommendation": f"Schedule high-value services on {day_names[best_day]}, use {day_names[worst_day]} for marketing/admin tasks"
        })
        
        return {
            "status": "success",
            "current_avg_revenue": float(df['revenue'].mean()),
            "trend_slope": float(trend_slope),
            "volatility": float(volatility),
            "predictions": [
                {
                    "date": (df['date'].iloc[-1] + timedelta(days=i+1)).strftime('%Y-%m-%d'),
                    "predicted_revenue": float(pred),
                    "confidence_interval": float(df['revenue'].std() * 1.96)
                }
                for i, pred in enumerate(predictions)
            ],
            "day_patterns": {day_names[k]: float(v) for k, v in day_patterns.items()},
            "insights": insights
        }
    
    def analyze_inventory_performance(self, inventory_data: List[Dict]) -> Dict[str, Any]:
        """
        Analyze inventory turnover and identify popular/slow-moving items.
        
        Args:
            inventory_data: List of products with sales velocity, stock levels
            
        Returns:
            Categorized inventory with recommendations
        """
        if not inventory_data:
            return {
                "status": "no_data",
                "message": "No inventory data available"
            }
        
        df = pd.DataFrame(inventory_data)
        
        # Calculate inventory turnover metrics
        if 'units_sold' in df.columns and 'current_stock' in df.columns:
            df['turnover_rate'] = df['units_sold'] / (df['current_stock'] + 1)  # +1 to avoid division by zero
            df['days_of_stock'] = df['current_stock'] / (df['units_sold'] / 30 + 1)
        
        # Calculate revenue contribution
        if 'revenue' in df.columns:
            total_revenue = df['revenue'].sum()
            df['revenue_share'] = (df['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
        
        # Categorize products
        popular_items = []
        slow_movers = []
        overstock_items = []
        stockout_risk = []
        
        for _, row in df.iterrows():
            item = {
                "product_name": row.get('name', row.get('product_name', 'Unknown')),
                "units_sold": int(row.get('units_sold', 0)),
                "current_stock": int(row.get('current_stock', 0)),
                "revenue": float(row.get('revenue', 0))
            }
            
            # Popular items (high turnover + high revenue share)
            if row.get('turnover_rate', 0) > df['turnover_rate'].quantile(0.75):
                popular_items.append({
                    **item,
                    "turnover_rate": float(row.get('turnover_rate', 0)),
                    "recommendation": "Increase stock levels to meet demand"
                })
            
            # Slow movers (low turnover)
            if row.get('turnover_rate', 0) < df['turnover_rate'].quantile(0.25):
                slow_movers.append({
                    **item,
                    "turnover_rate": float(row.get('turnover_rate', 0)),
                    "recommendation": "Consider promotion or phase-out"
                })
            
            # Overstock (high days of stock)
            if row.get('days_of_stock', 0) > 90:
                overstock_items.append({
                    **item,
                    "days_of_stock": float(row.get('days_of_stock', 0)),
                    "recommendation": "Reduce ordering or run clearance sale"
                })
            
            # Stockout risk (low days of stock on popular items)
            if row.get('days_of_stock', 0) < 14 and row.get('turnover_rate', 0) > df['turnover_rate'].median():
                stockout_risk.append({
                    **item,
                    "days_of_stock": float(row.get('days_of_stock', 0)),
                    "recommendation": "URGENT: Reorder immediately to prevent stockout"
                })
        
        # Generate summary insights
        insights = []
        
        if len(popular_items) > 0:
            top_revenue = sum(item['revenue'] for item in popular_items)
            insights.append({
                "type": "positive",
                "title": f"{len(popular_items)} High-Performance Products",
                "message": f"Top sellers generating ${top_revenue:,.0f} in revenue",
                "recommendation": "Focus inventory investment on these proven winners"
            })
        
        if len(stockout_risk) > 0:
            insights.append({
                "type": "critical",
                "title": f"⚠️ {len(stockout_risk)} Items at Stockout Risk",
                "message": "Popular items with less than 2 weeks of inventory",
                "recommendation": "Place emergency reorders within 24 hours"
            })
        
        if len(overstock_items) > 0:
            tied_capital = sum(item.get('revenue', 0) for item in overstock_items)
            insights.append({
                "type": "warning",
                "title": f"{len(overstock_items)} Overstock Items",
                "message": f"Approximately ${tied_capital:,.0f} in excess inventory",
                "recommendation": "Run promotions to free up capital and shelf space"
            })
        
        return {
            "status": "success",
            "summary": {
                "total_products": len(df),
                "popular_items_count": len(popular_items),
                "slow_movers_count": len(slow_movers),
                "overstock_count": len(overstock_items),
                "stockout_risk_count": len(stockout_risk)
            },
            "popular_items": popular_items[:10],  # Top 10
            "slow_movers": slow_movers[:10],
            "overstock_items": overstock_items[:10],
            "stockout_risk": stockout_risk,
            "insights": insights
        }
    
    def analyze_booking_patterns(self, booking_data: List[Dict]) -> Dict[str, Any]:
        """
        Analyze appointment booking patterns and capacity utilization.
        
        Args:
            booking_data: List of appointments with timestamps, status, duration
            
        Returns:
            Booking optimization recommendations
        """
        if not booking_data:
            return {
                "status": "no_data",
                "message": "No booking data available"
            }
        
        df = pd.DataFrame(booking_data)
        df['datetime'] = pd.to_datetime(df['datetime'])
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        
        # Calculate utilization by hour
        hourly_bookings = df.groupby('hour').size()
        total_slots_per_hour = df.groupby('hour')['total_slots'].first() if 'total_slots' in df.columns else pd.Series([10]*24, index=range(24))
        hourly_utilization = (hourly_bookings / total_slots_per_hour * 100).fillna(0)
        
        # Find peak and off-peak hours
        peak_hours = hourly_utilization[hourly_utilization > 80].index.tolist()
        off_peak_hours = hourly_utilization[hourly_utilization < 40].index.tolist()
        
        # Analyze no-show patterns
        no_show_rate = (df['status'] == 'no_show').sum() / len(df) * 100 if len(df) > 0 else 0
        
        # Day of week analysis
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_bookings = df.groupby('day_of_week').size()
        busiest_day = day_names[daily_bookings.idxmax()] if len(daily_bookings) > 0 else "Unknown"
        slowest_day = day_names[daily_bookings.idxmin()] if len(daily_bookings) > 0 else "Unknown"
        
        # Generate insights
        insights = []
        
        if len(peak_hours) > 0:
            insights.append({
                "type": "warning",
                "title": "Capacity Constraints Detected",
                "message": f"Hours {peak_hours} are over 80% booked",
                "recommendation": "Add staff or extend hours during peak times to capture more revenue"
            })
        
        if len(off_peak_hours) > 0:
            insights.append({
                "type": "info",
                "title": "Underutilized Time Slots",
                "message": f"Hours {off_peak_hours} are below 40% capacity",
                "recommendation": "Offer off-peak discounts or schedule admin tasks during these times"
            })
        
        if no_show_rate > 10:
            insights.append({
                "type": "warning",
                "title": "High No-Show Rate",
                "message": f"{no_show_rate:.1f}% of appointments are no-shows",
                "recommendation": "Implement SMS reminders, confirmation calls, or deposits for appointments"
            })
        
        insights.append({
            "type": "info",
            "title": "Weekly Booking Pattern",
            "message": f"Busiest: {busiest_day}, Slowest: {slowest_day}",
            "recommendation": f"Schedule high-margin services on {busiest_day}, use {slowest_day} for marketing campaigns"
        })
        
        return {
            "status": "success",
            "utilization_metrics": {
                "average_utilization": float(hourly_utilization.mean()),
                "peak_utilization": float(hourly_utilization.max()),
                "no_show_rate": float(no_show_rate)
            },
            "peak_hours": [int(h) for h in peak_hours],
            "off_peak_hours": [int(h) for h in off_peak_hours],
            "busiest_day": busiest_day,
            "slowest_day": slowest_day,
            "hourly_utilization": {int(k): float(v) for k, v in hourly_utilization.items()},
            "insights": insights
        }
    
    def generate_comparative_insights(self, company_metrics: Dict, platform_benchmarks: Dict) -> Dict[str, Any]:
        """
        Compare company performance against platform benchmarks.
        
        Args:
            company_metrics: Company's KPI data
            platform_benchmarks: Average metrics across all companies
            
        Returns:
            Comparative analysis with improvement recommendations
        """
        insights = []
        
        # Revenue comparison
        if 'revenue' in company_metrics and 'revenue' in platform_benchmarks:
            company_rev = company_metrics['revenue']
            benchmark_rev = platform_benchmarks['revenue']
            
            if company_rev > benchmark_rev * 1.2:
                insights.append({
                    "type": "positive",
                    "title": "Revenue Leader",
                    "message": f"Your revenue (${company_rev:,.0f}) is {((company_rev/benchmark_rev - 1)*100):.0f}% above platform average",
                    "recommendation": "Share best practices with other practices in your network"
                })
            elif company_rev < benchmark_rev * 0.8:
                gap = benchmark_rev - company_rev
                insights.append({
                    "type": "warning",
                    "title": "Revenue Gap",
                    "message": f"Revenue is ${gap:,.0f} below platform average",
                    "recommendation": "Review pricing strategy and service mix with top performers"
                })
        
        # Patient retention comparison
        if 'retention_rate' in company_metrics and 'retention_rate' in platform_benchmarks:
            company_retention = company_metrics['retention_rate']
            benchmark_retention = platform_benchmarks['retention_rate']
            
            if company_retention < benchmark_retention - 5:
                insights.append({
                    "type": "critical",
                    "title": "Retention Opportunity",
                    "message": f"Your retention rate ({company_retention:.1f}%) is below average ({benchmark_retention:.1f}%)",
                    "recommendation": "Implement loyalty program and automated recall system"
                })
        
        # Operational efficiency
        if 'no_show_rate' in company_metrics and 'no_show_rate' in platform_benchmarks:
            company_noshow = company_metrics['no_show_rate']
            benchmark_noshow = platform_benchmarks['no_show_rate']
            
            if company_noshow > benchmark_noshow + 3:
                insights.append({
                    "type": "warning",
                    "title": "Above-Average No-Shows",
                    "message": f"No-show rate ({company_noshow:.1f}%) is higher than average ({benchmark_noshow:.1f}%)",
                    "recommendation": "Top performers use automated SMS reminders 24 hours before appointments"
                })
        
        return {
            "status": "success",
            "performance_score": self._calculate_performance_score(company_metrics, platform_benchmarks),
            "insights": insights,
            "platform_ranking": self._estimate_ranking(company_metrics, platform_benchmarks)
        }
    
    def _calculate_performance_score(self, company: Dict, benchmark: Dict) -> float:
        """Calculate overall performance score (0-100)"""
        scores = []
        
        if 'revenue' in company and 'revenue' in benchmark and benchmark['revenue'] > 0:
            scores.append(min(100, (company['revenue'] / benchmark['revenue']) * 100))
        
        if 'retention_rate' in company and 'retention_rate' in benchmark:
            scores.append(min(100, (company['retention_rate'] / benchmark['retention_rate']) * 100))
        
        if 'no_show_rate' in company and 'no_show_rate' in benchmark and benchmark['no_show_rate'] > 0:
            # Lower is better for no-shows
            scores.append(min(100, (benchmark['no_show_rate'] / company['no_show_rate']) * 100) if company['no_show_rate'] > 0 else 100)
        
        return sum(scores) / len(scores) if scores else 50.0
    
    def _estimate_ranking(self, company: Dict, benchmark: Dict) -> str:
        """Estimate company's ranking tier"""
        score = self._calculate_performance_score(company, benchmark)
        
        if score >= 120:
            return "Top 10% - Industry Leader"
        elif score >= 110:
            return "Top 25% - High Performer"
        elif score >= 90:
            return "Average - Room for Growth"
        elif score >= 75:
            return "Below Average - Needs Improvement"
        else:
            return "Bottom 25% - Urgent Action Needed"


def main():
    """
    CLI interface for the BI Analytics AI engine.
    Accepts JSON input and returns JSON output.
    """
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Missing command",
            "usage": "python bi_analytics_ai.py <command> <json_data>"
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    ai = BIAnalyticsAI()
    
    if command == "analyze_sales":
        result = ai.analyze_sales_trends(data.get('sales_data', []))
    elif command == "analyze_inventory":
        result = ai.analyze_inventory_performance(data.get('inventory_data', []))
    elif command == "analyze_bookings":
        result = ai.analyze_booking_patterns(data.get('booking_data', []))
    elif command == "compare_performance":
        result = ai.generate_comparative_insights(
            data.get('company_metrics', {}),
            data.get('platform_benchmarks', {})
        )
    else:
        result = {"error": f"Unknown command: {command}"}
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
