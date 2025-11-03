# Integrated Lens System - Development Server

## Quick Start

Start both Node.js and Python services together:

```bash
npm run dev
```

This will automatically:
1. ✅ Start Python Analytics Service on port 8000
2. ✅ Start Node.js Backend on port 5000
3. ✅ Serve Frontend from port 5000

## Individual Services

Start services individually if needed:

```bash
# Node.js only (no Python ML features)
npm run dev:node

# Python service only
npm run dev:python

# Use bash script (Linux/Mac)
npm run dev:bash
```

## Services Overview

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5000 | http://localhost:5000 |
| Backend API | 5000 | http://localhost:5000/api |
| Python ML Service | 8000 | http://localhost:8000 |

## Python Service Features

The Python service provides:
- 📊 Advanced analytics and reporting
- 🤖 ML-based production time predictions
- ✅ Quality control automated analysis
- 📈 Order trend analysis
- 💡 AI-powered lens recommendations

## Stopping Services

Press `Ctrl+C` to stop all services gracefully.

## Troubleshooting

### Python service not starting

1. Check Python is installed: `python3 --version`
2. Install dependencies manually:
   ```bash
   cd python-service
   python3 -m pip install --user -r requirements.txt
   ```
3. Check logs: `cat logs/python-service.log`

### Port already in use

Kill existing processes:
```bash
# Kill Node.js
pkill -f "tsx server"

# Kill Python
pkill -f "python.*main.py"

# Kill Vite
pkill -f "vite"
```

## Environment Variables

Configure services via `.env` files:
- Root `.env` - Node.js backend configuration
- `python-service/.env` - Python service configuration

## Logs

Development logs are stored in `logs/`:
- `python-service.log` - Python service output
