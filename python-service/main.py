from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from dotenv import load_dotenv
from datetime import datetime
from db_utils import get_order_trends_from_db, get_batch_report_from_db, db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager with startup logging."""
    # Startup
    logger.info("Starting ILS Python Analytics Service...")
    logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT', 'development')}")
    logger.info(f"Port: {os.getenv('PORT', '8000')}")
    logger.info(f"Database configured: {db.is_configured()}")

    yield

    # Shutdown
    logger.info("Shutting down ILS Python Analytics Service...")


app = FastAPI(
    title="ILS Analytics Service",
    description="Python microservice for analytics and ML in Integrated Lens System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow Node.js backend and Railway to call this service
# Get allowed origins from environment or use defaults
cors_origins = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

# Add default origins for development
default_origins = [
    os.getenv("BACKEND_URL", "http://localhost:5000"),
    "http://localhost:3000",  # Frontend dev server
    "http://localhost:5001",  # Alternative backend port
]

# Merge origins, avoiding duplicates
all_origins = list(set(cors_origins + default_origins))

# In production on Railway, also allow all origins from same Railway project
if os.getenv("RAILWAY_ENVIRONMENT"):
    all_origins.append("*")  # Railway internal communication

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins if all_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint. Returns 200 even in degraded mode for Railway.
    This endpoint must ALWAYS return 200 to keep the service alive.
    """
    db_configured = db.is_configured()

    return {
        "status": "healthy" if db_configured else "degraded",
        "service": "python-analytics",
        "version": "1.0.0",
        "database": "configured" if db_configured else "not_configured",
        "timestamp": datetime.utcnow().isoformat()
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "ILS Python Analytics Service",
        "endpoints": [
            "/health",
            "/api/v1/analytics/order-trends",
            "/api/v1/ml/predict-production-time",
            "/api/v1/qc/analyze",
            "/api/v1/analytics/batch-report"
        ]
    }

# Example: Order Analytics
@app.get("/api/v1/analytics/order-trends")
async def get_order_trends(days: int = 30):
    """
    Analyze order trends over the past N days.
    Fetches real data from database when configured.
    """
    # Try to fetch from database
    db_data = get_order_trends_from_db(days)

    # If database is configured and returns data, use it
    if db_data:
        return db_data

    # Fallback to example data structure when database is not configured
    # This allows the service to run in development without a database
    return {
        "period_days": days,
        "total_orders": 247,
        "average_per_day": 8.2,
        "trend": "increasing",
        "growth_percentage": 12.5,
        "predictions": {
            "next_week": 58,
            "next_month": 250
        },
        "top_lens_types": [
            {"type": "single_vision", "count": 145},
            {"type": "progressive", "count": 78},
            {"type": "bifocal", "count": 24}
        ],
        "_note": "Using example data. Configure DATABASE_URL to fetch real data."
    }

# Example: Production Time Prediction
class OrderPredictionRequest(BaseModel):
    lens_type: str
    lens_material: str
    coating: str
    complexity_score: Optional[int] = 1

@app.post("/api/v1/ml/predict-production-time")
async def predict_production_time(request: OrderPredictionRequest):
    """
    Predict production time using ML model
    """
    # Simple rule-based prediction (replace with actual ML model)
    base_time = 120  # minutes
    
    # Adjust based on complexity
    multipliers = {
        "single_vision": 1.0,
        "single vision": 1.0,
        "progressive": 1.5,
        "bifocal": 1.3,
    }
    
    material_multipliers = {
        "cr-39": 1.0,
        "polycarbonate": 1.1,
        "high_index": 1.2,
        "high index": 1.2,
        "trivex": 1.15,
    }
    
    coating_time = {
        "none": 0,
        "anti_reflective": 30,
        "anti-reflective": 30,
        "blue_light": 20,
        "blue light": 20,
        "photochromic": 45,
    }
    
    lens_multiplier = multipliers.get(request.lens_type.lower(), 1.0)
    material_multiplier = material_multipliers.get(request.lens_material.lower(), 1.0)
    coating_addon = coating_time.get(request.coating.lower(), 0)
    
    estimated_time = (base_time * lens_multiplier * material_multiplier) + coating_addon
    
    return {
        "estimated_minutes": int(estimated_time),
        "estimated_hours": round(estimated_time / 60, 1),
        "estimated_days": round(estimated_time / (60 * 8), 1),  # 8-hour workday
        "confidence": 0.85,
        "factors": {
            "lens_type_impact": lens_multiplier,
            "material_impact": material_multiplier,
            "coating_time": coating_addon
        },
        "breakdown": {
            "base_time": base_time,
            "lens_adjustment": base_time * (lens_multiplier - 1),
            "material_adjustment": base_time * lens_multiplier * (material_multiplier - 1),
            "coating_time": coating_addon
        }
    }

# Example: Quality Control Analysis
class QCDataRequest(BaseModel):
    order_id: str
    measurements: dict
    images: Optional[List[str]] = None

@app.post("/api/v1/qc/analyze")
async def analyze_quality_control(request: QCDataRequest):
    """
    Analyze quality control data and predict pass/fail.
    Uses rule-based validation. Can be enhanced with ML models.
    """
    # Rule-based QC analysis
    # In production: can integrate with actual ML model for defect detection

    issues = []
    should_inspect = False

    # Check if measurements exist
    if not request.measurements:
        issues.append("No measurements provided")
        should_inspect = True

    # Validate measurement ranges
    if "sphere" in request.measurements:
        sphere = request.measurements.get("sphere", 0)
        if abs(sphere) > 15:
            issues.append("Sphere power outside normal range")
            should_inspect = True

    if "cylinder" in request.measurements:
        cylinder = request.measurements.get("cylinder", 0)
        if abs(cylinder) > 6:
            issues.append("Cylinder power outside normal range")
            should_inspect = True

    if "axis" in request.measurements:
        axis = request.measurements.get("axis", 0)
        if axis < 0 or axis > 180:
            issues.append("Axis value must be between 0 and 180")
            should_inspect = True

    # Check for image-based defects if images are provided
    if request.images and len(request.images) > 0:
        # Placeholder for computer vision model
        # In production: integrate with CV model for scratch/defect detection
        pass

    qc_status = "pass" if len(issues) == 0 else "review_needed"

    return {
        "order_id": request.order_id,
        "qc_status": qc_status,
        "confidence": 0.92 if qc_status == "pass" else 0.65,
        "issues_detected": issues,
        "recommendations": [
            "Measurements within tolerance" if qc_status == "pass" else "Manual inspection recommended",
            "No defects detected" if not issues else f"Found {len(issues)} potential issues"
        ],
        "should_inspect_manually": should_inspect,
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "_note": "Using rule-based validation. Integrate ML model for enhanced accuracy."
    }

# Example: Batch Analytics
@app.post("/api/v1/analytics/batch-report")
async def generate_batch_report(order_ids: List[str]):
    """
    Generate comprehensive analytics report for multiple orders.
    Fetches real data from database when configured.
    """
    # Try to fetch from database
    db_report = get_batch_report_from_db(order_ids)

    # If database is configured and returns data, use it
    if db_report:
        # Add generated timestamp and recommendations
        db_report["generated_at"] = datetime.utcnow().isoformat()
        db_report["recommendations"] = [
            f"Analyzed {len(order_ids)} orders successfully",
            "Review high-value orders for quality assurance"
        ]
        return db_report

    # Fallback to example data when database is not configured
    report = {
        "total_orders": len(order_ids),
        "order_ids": order_ids,
        "summary": {
            "total_revenue": 12450.00,
            "average_order_value": 415.00,
            "completion_rate": 0.94,
            "average_production_time": 145.5
        },
        "breakdown_by_lens_type": {
            "single_vision": 45,
            "progressive": 28,
            "bifocal": 12
        },
        "breakdown_by_status": {
            "completed": len(order_ids) - 2,
            "in_progress": 2,
            "pending": 0
        },
        "recommendations": [
            "Consider bulk ordering CR-39 material",
            "Progressive lens production time above average",
            f"Analyzed {len(order_ids)} orders successfully"
        ],
        "generated_at": datetime.utcnow().isoformat(),
        "_note": "Using example data. Configure DATABASE_URL to fetch real data."
    }

    return report

# Example: Lens Recommendation
class LensRecommendationRequest(BaseModel):
    prescription: dict
    patient_age: Optional[int] = None
    lifestyle: Optional[str] = None
    budget: Optional[str] = None

@app.post("/api/v1/ml/recommend-lens")
async def recommend_lens(request: LensRecommendationRequest):
    """
    AI-powered lens recommendation based on prescription and patient profile
    """
    recommendations = []
    
    # Simple rule-based recommendations (replace with ML model)
    sphere = request.prescription.get("sphere", 0)
    cylinder = request.prescription.get("cylinder", 0)
    age = request.patient_age or 30
    
    # Age-based recommendations
    if age >= 40:
        recommendations.append({
            "lens_type": "progressive",
            "reason": "Age-appropriate for presbyopia",
            "confidence": 0.9
        })
    else:
        recommendations.append({
            "lens_type": "single_vision",
            "reason": "Optimal for non-presbyopic patients",
            "confidence": 0.95
        })
    
    # Material recommendations based on prescription
    if abs(sphere) > 4 or abs(cylinder) > 2:
        recommendations.append({
            "material": "high_index",
            "reason": "Thinner and lighter for strong prescription",
            "confidence": 0.88
        })
    else:
        recommendations.append({
            "material": "cr-39",
            "reason": "Cost-effective and durable",
            "confidence": 0.85
        })
    
    return {
        "recommendations": recommendations,
        "patient_profile": {
            "age": age,
            "prescription_strength": "high" if abs(sphere) > 4 else "moderate" if abs(sphere) > 2 else "low",
            "lifestyle": request.lifestyle or "general"
        },
        "confidence_overall": 0.87
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=int(os.getenv("PORT", "8000")),
        reload=False  # Disable reload to prevent constant reloading
    )