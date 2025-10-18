# Deployment Guide - AI Bedtime Story Generator

This guide will help you deploy both the frontend and backend to Render using the provided configuration.

## Prerequisites

1. A [Render](https://render.com) account
2. A [GitHub](https://github.com) account
3. Your repository pushed to GitHub
4. An OpenAI API key

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to create both services

3. **Set Environment Variables:**
   - Go to the backend service dashboard
   - Navigate to "Environment" tab
   - Add your `OPENAI_API_KEY`
   - Save changes

4. **Done!** Your services will deploy automatically.

---

## Option 2: Manual Setup

### Deploy Backend

1. **Create Web Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `bedtime-story-backend`
     - **Root Directory:** `backend`
     - **Runtime:** `Python 3`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT api:app`

2. **Set Environment Variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: `5001` (optional, Render sets this automatically)

3. **Health Check:**
   - Path: `/api/health`

### Deploy Frontend

1. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `bedtime-story-frontend`
     - **Root Directory:** `frontend`
     - **Runtime:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`

2. **Set Environment Variables:**
   - `BACKEND_URL`: `https://bedtime-story-backend.onrender.com` (use your actual backend URL)

---

## GitHub Actions Auto-Deploy

### Setup

1. **Get Render API Key:**
   - Go to [Render Account Settings](https://dashboard.render.com/account)
   - Create a new API key
   - Copy the key

2. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `RENDER_API_KEY`: Your Render API key
     - `RENDER_SERVICE_ID`: Your Render service ID (find in service URL)

3. **Auto-deploy is now configured!**
   - Every push to `main` branch will trigger deployment
   - You can also manually trigger from GitHub Actions tab

---

## Configuration Files

### `render.yaml`
Defines both services and their configuration. Located at project root.

### `.github/workflows/deploy.yml`
GitHub Actions workflow for automatic deployment on push.

### Backend Configuration
- **Runtime:** Python 3.11
- **Port:** 5001 (configurable via PORT env var)
- **Dependencies:** Listed in `backend/requirements.txt`
- **Entry Point:** `backend/api.py`

### Frontend Configuration
- **Runtime:** Node 18
- **Framework:** Next.js
- **Build:** Static export
- **Auto-connects:** To backend via `BACKEND_URL` env var

---

## Environment Variables

### Backend (Required)
- `OPENAI_API_KEY`: Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- `PORT`: Port number (auto-set by Render, default 5001 for local)

### Frontend (Auto-configured)
- `BACKEND_URL`: Backend service URL (auto-connected via render.yaml)
- `NODE_VERSION`: 18 (specified in render.yaml)

---

## Verify Deployment

### Check Backend
```bash
curl https://your-backend-url.onrender.com/api/health
```
Expected response:
```json
{"status": "healthy", "message": "AI Bedtime Story Generator API is running"}
```

### Check Frontend
Visit: `https://your-frontend-url.onrender.com`

---

## Troubleshooting

### Backend Issues

**Problem:** Service fails to start
- **Solution:** Check logs in Render dashboard
- Verify `OPENAI_API_KEY` is set correctly
- Ensure `requirements.txt` is up to date

**Problem:** Import errors
- **Solution:** Run `pip freeze > requirements.txt` locally to update dependencies

### Frontend Issues

**Problem:** Cannot connect to backend
- **Solution:** Verify `BACKEND_URL` environment variable points to correct backend URL
- Check CORS settings in backend

**Problem:** Build fails
- **Solution:** Run `npm install` and `npm run build` locally to verify
- Check Node version matches (18)

### GitHub Actions Issues

**Problem:** Deployment workflow fails
- **Solution:**
  - Verify `RENDER_API_KEY` secret is set correctly
  - Check `RENDER_SERVICE_ID` is correct
  - View detailed logs in GitHub Actions tab

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python api.py
```
Runs on: http://localhost:5001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on: http://localhost:3000

---

## Costs

- **Render Free Plan:**
  - 750 hours/month free (enough for 2 services)
  - Services sleep after 15 minutes of inactivity
  - Cold start time: ~30 seconds

- **OpenAI API:**
  - Pay per usage
  - GPT-3.5-turbo: ~$0.002 per story generation
  - Monitor usage in [OpenAI Dashboard](https://platform.openai.com/usage)

---

## Support

- [Render Documentation](https://render.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## Production Checklist

- [ ] Environment variables set (especially `OPENAI_API_KEY`)
- [ ] Health check endpoint working (`/api/health`)
- [ ] CORS configured correctly
- [ ] Frontend connects to backend successfully
- [ ] GitHub Actions secrets configured
- [ ] Test story generation end-to-end
- [ ] Monitor OpenAI API usage

---

## URLs After Deployment

Your services will be available at:
- **Backend:** `https://bedtime-story-backend.onrender.com`
- **Frontend:** `https://bedtime-story-frontend.onrender.com`
- **Health Check:** `https://bedtime-story-backend.onrender.com/api/health`

Replace with your actual service names from Render dashboard.
