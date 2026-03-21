# WasteWise Project Setup Guide

## 1. Prerequisites
Ensure you have the following installed on your system:
- Node.js (v18 or higher)
- Python (v3.10 or v3.11 recommended)
- MongoDB (Local installation or MongoDB Atlas account)
- Git

## 2. Environment Variables Setup

### Backend Environment Variables
Create a `.env` file inside the `backend` directory:
```text
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_test_key
```

### ML Service Environment Variables
Create a `.env` file inside the `ml_service` directory:
```text
OPENAI_API_KEY=your_openai_api_key
```

## 3. Terminal Setup Commands

You will need to open three separate terminal windows to run the full application.

### Terminal 1: Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install Node.js dependencies
npm install

# Start the backend server
node server.js
```

### Terminal 2: Frontend Setup
```bash
# Navigate to the frontend directory
cd app

# Install React dependencies
npm install

# Start the Vite development server
npm run dev
```

### Terminal 3: Machine Learning Service Setup
```bash
# Navigate to the ML service directory
cd ml_service

# Create a Python virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask service
python app.py
```
