# WasteWise Project Setup Guide

WasteWise is a comprehensive industrial waste marketplace platform. It connects businesses to efficiently trade, manage, and recycle industrial waste through an advanced, secure platform environment.

## 🌟 Key Features

![WasteWise Dashboard Presentation](https://fake-image.com/dashboard-preview.png)

*   **Intelligent Listings & ML Integration:** Sellers can easily upload waste listings. A dedicated ML Model, augmented by the Gemini API, automatically categorizes the material and evaluates the quality grade based on uploaded images.
*   **Dynamic Bidding System:** An interactive marketplace where buyers can place bids on available industrial waste items.
*   **Comprehensive Notifications & Mailing:** Integrated automated on-platform notifications and email alerts keep users informed about their bids, listings, and contract states.
*   **Long-Term Contracts & PDFs:** Facilitates the creation of Long-Term Service Level Agreements (SLAs). Once finalized, the system automatically generates binding PDF contracts for both parties.
*   **Green Certificates & Blockchain Verification:** Awards Green Certificates to companies validating their eco-friendly recycling contributions. The system utilizes SHA-256 cryptographic hashing—mimicking blockchain immutability—to generate a unique, tamper-proof "digital fingerprint" printed directly on every certificate to guarantee its authenticity.
*   **Integrated Logistics & Delivery:** Features a dedicated Deliveryman role. Logistics pickup and transport fees are automatically calculated utilizing the Google Maps Distance Matrix API.
*   **QR Code Tracking:** Employs QR Codes for physical tracking, ensuring secure and verified pick-up and drop-off of waste items.
*   **Advanced Admin Verification:** A centralized Admin Dashboard designed to monitor platform health, resolve disputes, and manually verify new Seller and Deliveryman accounts for a secure ecosystem.

![WasteWise System Architecture](https://fake-image.com/architecture-preview.png)
## Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Node.js, Express, MongoDB
* **ML Service:** Python, Flask, Google Gemini AI (through Google AI Studio)

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
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NODE_ENV=development
```

**How to get these required backend values:**
* **PORT**: This is the network port your local development server will run on. `5000` is a standard default, but you can change it to any available open port on your machine.
* **MONGO_URI**: This is the connection address for your database.
    * *Local MongoDB*: If you installed MongoDB on your computer, use `mongodb://localhost:27017/your_database_name`.
    * *Cloud MongoDB*: Create a free account on MongoDB Atlas, set up a cluster, click "Connect", choose "Connect your application", and copy the provided URI. 
* **JWT_SECRET**: This is a private, random string used to securely sign user login tokens. You must generate this yourself. For local testing, any random text works. For a secure production key, run this in your terminal to generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
*   **STRIPE_SECRET_KEY**: Create a free developer account at Stripe.com. Open the Stripe Developer Dashboard, navigate to the "API keys" tab, ensure "Test mode" is turned on, and copy the "Secret key".
*   **GOOGLE_MAPS_API_KEY**: This is used for the Distance Matrix API to calculate logistics fees.
    1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
    2.  Create a new project (e.g., `WasteWise-Logistics`).
    3.  Enable the **Distance Matrix API**.
    4.  Set up **Billing** (Note: $200 free credit monthly).
    5.  Go to **APIs & Services > Credentials**, click **+ CREATE CREDENTIALS**, and select **API key**.
    6.  Copy and paste this key into your `.env`.
*   **NODE_ENV**: Tells the server what environment it is running in. Set this to `development` for local work.

### ML Service Environment Variables
Create a `.env` file inside the `ml_service` directory:
```text
GEMINI_API_KEY=your_gemini_api_key
```

**How to get these required ML service values:**
* **GEMINI_API_KEY**: Create an account at [Google AI Studio](https://aistudio.google.com/). Go to the "Get API key" section, create a new API key, and copy it. This is used for the Gemini Flash Latest model.

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

> [!NOTE]
> The ML service runs on port `5001` to avoid conflicts with the backend server which runs on port `5000`.
