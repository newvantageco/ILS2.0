# Python Integration Guide - Microservice Architecture

## 🐍 Overview

This guide explains how to add Python to your Integrated Lens System as a **separate microservice** for specialized tasks like data analysis, machine learning, and complex file processing.

---

## 🏗️ Architecture Design

### Current Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **Auth**: Passport.js

### Proposed Python Integration
```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│            (TypeScript + Vite + shadcn/ui)          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────┐
│              Node.js/Express Backend                 │
│         (Main API - Orders, Auth, CRUD)             │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Calls Python microservice for:              │  │
│  │  - Data analysis                             │  │
│  │  - ML predictions                            │  │
│  │  - Complex calculations                      │  │
│  └──────────────────┬───────────────────────────┘  │
└────────────────────┬┴──────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────┐
│            Python Microservice (FastAPI)            │
│                                                      │
│  Services:                                          │
│  - Order Analytics & Reporting                      │
│  - Production Time Prediction (ML)                  │
│  - Quality Control Analysis                         │
│  - Lens Optimization Algorithms                     │
│  - Complex OMA File Processing                      │
│  - Image Analysis (Computer Vision)                 │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │   PostgreSQL    │
            │  (Shared DB)    │
            └────────────────┘
```

---

## 🚀 Why Add Python?

### Use Cases for Your Lens System

1. **Data Analysis & Reporting**
   - Analyze order trends and patterns
   - Calculate production efficiency metrics
   - Generate statistical reports
   - Predict busy periods

2. **Machine Learning**
   - **Production Time Prediction**: Estimate how long an order will take
   - **Quality Control**: Predict potential issues before production
   - **Demand Forecasting**: Predict future order volumes
   - **Recommendation System**: Suggest optimal lens combinations

3. **Computer Vision (Future)**
   - Analyze uploaded lens images for QC
   - Automatic defect detection
   - Frame measurement from photos
   - Pattern recognition in tracings

4. **Complex Processing**
   - Advanced OMA file parsing and validation
   - Scientific calculations for lens parameters
   - Optimization algorithms for production scheduling
   - Statistical analysis of prescription data

---

## 📦 Python Microservice Setup

### Step 1: Create Python Service Directory

```bash
cd /Users/saban/Downloads/IntegratedLensSystem
mkdir python-service
cd python-service
```

### Step 2: Initialize Python Project

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate     # Windows

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
python-dotenv==1.0.0
httpx==0.25.1
EOF

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Create FastAPI Service

Create `python-service/main.py`:

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="ILS Analytics Service",
    description="Python microservice for analytics and ML in Integrated Lens System",
    version="1.0.0"
)

# CORS configuration - allow Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:5000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-analytics"}

# Example: Order Analytics
@app.get("/api/v1/analytics/order-trends")
async def get_order_trends(days: int = 30):
    """
    Analyze order trends over the past N days
    """
    # In production, fetch from database
    # For now, returning mock data structure
    return {
        "period_days": days,
        "total_orders": 247,
        "average_per_day": 8.2,
        "trend": "increasing",
        "growth_percentage": 12.5,
        "predictions": {
            "next_week": 58,
            "next_month": 250
        }
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
        "progressive": 1.5,
        "bifocal": 1.3,
    }
    
    material_multipliers = {
        "CR-39": 1.0,
        "polycarbonate": 1.1,
        "high_index": 1.2,
        "trivex": 1.15,
    }
    
    coating_time = {
        "none": 0,
        "anti_reflective": 30,
        "blue_light": 20,
        "photochromic": 45,
    }
    
    lens_multiplier = multipliers.get(request.lens_type.lower(), 1.0)
    material_multiplier = material_multipliers.get(request.lens_material.lower(), 1.0)
    coating_addon = coating_time.get(request.coating.lower(), 0)
    
    estimated_time = (base_time * lens_multiplier * material_multiplier) + coating_addon
    
    return {
        "estimated_minutes": int(estimated_time),
        "estimated_hours": round(estimated_time / 60, 1),
        "confidence": 0.85,
        "factors": {
            "lens_type_impact": lens_multiplier,
            "material_impact": material_multiplier,
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
    Analyze quality control data and predict pass/fail
    """
    # Mock QC analysis (replace with actual ML model)
    # In production: analyze measurements, check tolerances, use CV on images
    
    return {
        "order_id": request.order_id,
        "qc_status": "pass",
        "confidence": 0.92,
        "issues_detected": [],
        "recommendations": [
            "Measurements within tolerance",
            "No defects detected"
        ],
        "should_inspect_manually": False
    }

# Example: Advanced OMA File Processing
class OMAFileRequest(BaseModel):
    filename: str
    content: str

@app.post("/api/v1/files/parse-oma")
async def parse_oma_file(request: OMAFileRequest):
    """
    Advanced OMA file parsing with Python
    """
    # Python has better libraries for complex file parsing
    # Parse OMA format and extract all data
    
    return {
        "filename": request.filename,
        "parsed_successfully": True,
        "frame_data": {
            "a_measurement": 52.0,
            "b_measurement": 45.0,
            "dbl": 18.0,
            "ed": 55.0
        },
        "trace_data": {
            "points": 360,
            "format": "polar"
        },
        "validation": {
            "is_valid": True,
            "warnings": []
        }
    }

# Example: Batch Analytics
@app.post("/api/v1/analytics/batch-report")
async def generate_batch_report(order_ids: List[str]):
    """
    Generate comprehensive analytics report for multiple orders
    Uses pandas for data processing
    """
    # In production: fetch orders from DB, process with pandas
    
    report = {
        "total_orders": len(order_ids),
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
        "recommendations": [
            "Consider bulk ordering CR-39 material",
            "Progressive lens production time above average"
        ]
    }
    
    return report

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", "8000")),
        reload=True  # Development only
    )
```

### Step 4: Create Environment Configuration

Create `python-service/.env`:

```env
# Python Service Configuration
PORT=8000
BACKEND_URL=http://localhost:5000
DATABASE_URL=postgres://user:password@localhost:5432/ils_db

# ML Model Configuration
MODEL_PATH=./models
CONFIDENCE_THRESHOLD=0.85

# API Keys (if using external services)
# OPENAI_API_KEY=your-key-here
```

### Step 5: Run the Python Service

```bash
cd python-service
source venv/bin/activate
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

The service will be available at: `http://localhost:8000`

---

## 🔗 Integrate with Node.js Backend

### Update Node.js Backend to Call Python Service

Add to your `server/index.ts` or create `server/services/pythonService.ts`:

```typescript
import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Helper function to call Python service
async function callPythonService(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET') {
  try {
    const url = `${PYTHON_SERVICE_URL}${endpoint}`;
    const response = method === 'GET' 
      ? await axios.get(url, { params: data })
      : await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`Python service error (${endpoint}):`, error);
    throw new Error(`Failed to call Python analytics service: ${error.message}`);
  }
}

// Example: Get order trends
export async function getOrderTrends(days: number = 30) {
  return callPythonService('/api/v1/analytics/order-trends', { days }, 'GET');
}

// Example: Predict production time
export async function predictProductionTime(orderData: {
  lensType: string;
  lensMaterial: string;
  coating: string;
  complexityScore?: number;
}) {
  return callPythonService('/api/v1/ml/predict-production-time', {
    lens_type: orderData.lensType,
    lens_material: orderData.lensMaterial,
    coating: orderData.coating,
    complexity_score: orderData.complexityScore || 1
  }, 'POST');
}

// Example: QC Analysis
export async function analyzeQualityControl(qcData: {
  orderId: string;
  measurements: Record<string, number>;
  images?: string[];
}) {
  return callPythonService('/api/v1/qc/analyze', {
    order_id: qcData.orderId,
    measurements: qcData.measurements,
    images: qcData.images
  }, 'POST');
}
```

### Add Express Routes That Use Python Service

Add to your `server/routes.ts`:

```typescript
import express from 'express';
import { getOrderTrends, predictProductionTime, analyzeQualityControl } from './services/pythonService';

const router = express.Router();

// Analytics endpoint that calls Python service
router.get('/api/analytics/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await getOrderTrends(days);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production time prediction
router.post('/api/orders/predict-time', async (req, res) => {
  try {
    const prediction = await predictProductionTime(req.body);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QC analysis
router.post('/api/qc/analyze', async (req, res) => {
  try {
    const analysis = await analyzeQualityControl(req.body);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🎯 Practical Use Cases

### 1. **Show Production Time Estimate in Order Form**

Update `client/src/pages/NewOrderPage.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";

// In your wizard, after selecting lens type, material, coating:
const { data: timeEstimate } = useQuery({
  queryKey: ['/api/orders/predict-time', formData.lensType, formData.lensMaterial, formData.coating],
  queryFn: async () => {
    if (!formData.lensType || !formData.lensMaterial || !formData.coating) return null;
    
    const response = await fetch('/api/orders/predict-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lensType: formData.lensType,
        lensMaterial: formData.lensMaterial,
        coating: formData.coating,
      }),
    });
    return response.json();
  },
  enabled: !!(formData.lensType && formData.lensMaterial && formData.coating),
});

// Display in UI:
{timeEstimate && (
  <Alert>
    <Clock className="h-4 w-4" />
    <AlertTitle>Estimated Production Time</AlertTitle>
    <AlertDescription>
      This order will take approximately {timeEstimate.estimated_hours} hours to complete.
    </AlertDescription>
  </Alert>
)}
```

### 2. **Analytics Dashboard with Python-Powered Charts**

Create `client/src/pages/AnalyticsDashboard.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const { data: trends } = useQuery({
    queryKey: ['/api/analytics/trends'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/trends?days=30');
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{trends?.total_orders}</p>
            <p className="text-sm text-muted-foreground">
              {trends?.trend === 'increasing' ? '↑' : '↓'} {trends?.growth_percentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Orders/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{trends?.average_per_day}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Month Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{trends?.predictions?.next_month}</p>
            <p className="text-sm text-muted-foreground">ML-powered forecast</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 3. **QC Prediction Before Shipping**

Add to lab technician workflow:

```tsx
// When lab tech is about to ship an order
const { data: qcAnalysis, isLoading: isAnalyzing } = useQuery({
  queryKey: ['/api/qc/analyze', orderId],
  queryFn: async () => {
    const response = await fetch('/api/qc/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        measurements: orderMeasurements,
      }),
    });
    return response.json();
  },
});

{qcAnalysis?.should_inspect_manually && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Manual Inspection Recommended</AlertTitle>
    <AlertDescription>
      The AI detected potential issues. Please inspect manually before shipping.
    </AlertDescription>
  </Alert>
)}
```

---

## 🔧 Development Workflow

### Running Both Services

Create `package.json` script to run both:

```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "dev:python": "cd python-service && source venv/bin/activate && python main.py",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:python\" \"npm run client:dev\"",
    "client:dev": "vite"
  }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

Run everything:
```bash
npm run dev:all
```

---

## 📊 Database Access from Python

### Using SQLAlchemy (Optional)

Create `python-service/database.py`:

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define models (should match your Node.js schema)
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True)
    patient_name = Column(String)
    lens_type = Column(String)
    status = Column(String)
    created_at = Column(DateTime)

# Use in endpoints:
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In your FastAPI endpoint:
from fastapi import Depends
from sqlalchemy.orm import Session

@app.get("/api/v1/analytics/order-stats")
def get_order_stats(db: Session = Depends(get_db)):
    total = db.query(Order).count()
    return {"total_orders": total}
```

---

## 🚀 Deployment

### Docker Setup (Recommended)

Create `python-service/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  node-backend:
    # ... existing node config ...
    environment:
      - PYTHON_SERVICE_URL=http://python-service:8000

  python-service:
    build: ./python-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BACKEND_URL=http://node-backend:5000
    depends_on:
      - postgres

  postgres:
    # ... existing postgres config ...
```

---

## 📚 Next Steps

### Immediate (Week 1)
1. ✅ Set up basic FastAPI service
2. ✅ Create health check and test endpoints
3. ✅ Integrate one simple analytics endpoint
4. ✅ Test Node.js → Python communication

### Short-term (Month 1)
5. Add production time prediction
6. Implement basic ML model training
7. Create analytics dashboard in React
8. Add comprehensive error handling

### Long-term (Month 2-3)
9. Train ML models on real data
10. Add computer vision for QC
11. Implement batch processing
12. Optimize performance and caching

---

## 🎯 Summary

**What You Get:**
- Python microservice for specialized tasks
- FastAPI for modern, fast Python web service
- Clean separation of concerns
- Best tool for each job
- Scalable architecture

**When to Use Python vs Node.js:**
- **Node.js**: CRUD operations, auth, real-time features
- **Python**: Data analysis, ML, scientific computing, complex algorithms

**Benefits:**
- Leverage Python's ML/data science ecosystem
- Keep your Node.js backend fast and focused
- Scale services independently
- Use the right tool for the right job

---

**Ready to start?** Follow Step 1 to create your Python microservice!
