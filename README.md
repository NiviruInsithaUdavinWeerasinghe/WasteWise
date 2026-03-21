# WasteWise Project Setup Guide

WasteWise is an industrial waste marketplace platform. It connects businesses to efficiently trade, manage, and recycle industrial waste, utilizing a machine learning service for intelligent waste categorization and matching.

## Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Node.js, Express, MongoDB
* **ML Service:** Python, Flask, OpenAI API

---

## 1. Prerequisites
Ensure you have the following installed on your system:
- Node.js (v18 or higher)
- Python (v3.10 or v3.11 recommended)
- MongoDB (Local installation or MongoDB Atlas account)
- Git

## 2. Environment Variables Setup

Environment variables are used to store sensitive information and configuration settings outside of the source code. Because these values handle passwords and API keys, every developer working on the project needs to generate and use their own personal values for their local setup.

### Backend Environment Variables
Create a `.env` file inside the `backend` directory:
```text
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_test_key
NODE_ENV=development
```

**How to get these required backend values:**
* **PORT**: This is the network port your local development server will run on. `5000` is a standard default, but you can change it to any available open port on your machine.
* **MONGO_URI**: This is the connection address for your database.
    * *Local MongoDB*: If you installed MongoDB on your computer, use `mongodb://localhost:27017/your_database_name`.
    * *Cloud MongoDB*: Create a free account on MongoDB Atlas, set up a cluster, click "Connect", choose "Connect your application", and copy the provided URI. 
* **JWT_SECRET**: This is a private, random string used to securely sign user login tokens. You must generate this yourself. For local testing, any random text works. For a secure production key, run this in your terminal to generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
* **STRIPE_SECRET_KEY**: Create a free developer account at Stripe.com. Open the Stripe Developer Dashboard, navigate to the "API keys" tab, ensure "Test mode" is turned on, and copy the "Secret key".
* **NODE_ENV**: Tells the server what environment it is running in. Set this to `development` for local work.

### ML Service Environment Variables
Create a `.env` file inside the `ml_service` directory:
```text
OPENAI_API_KEY=your_openai_api_key
```

**How to get these required ML service values:**
* **OPENAI_API_KEY**: Create an account at platform.openai.com. Go to your dashboard, navigate to the "API keys" section, and click "Create new secret key". Copy the generated key. Note that OpenAI requires an active billing account for API requests to work.

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
