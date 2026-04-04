// Centralized API URL configuration
// All environment-based URLs are sourced from VITE_ env variables.
// In local dev, create a .env.local with VITE_API_BASE_URL=http://localhost:5000/api
// In production, Vercel will inject the variables from your project settings.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || 'http://127.0.0.1:5001';
