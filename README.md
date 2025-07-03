# 🍽️ FoodExpress – Modern Food Delivery App

A full-stack food delivery platform built with **React**, **TypeScript**, and **Node.js**, featuring real-time order tracking, restaurant listings, and secure authentication.

---

## 🚀 Features

- 🔐 User login & signup with JWT authentication
- 🏪 Restaurant listings with search functionality
- 🍔 Menu and item management
- 📦 Order placement and real-time tracking
- 📱 Fully responsive mobile-first design
- 🛠️ Admin and user role separation
- 🔔 Live order status updates (socket-based or API polling)

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ React with TypeScript
- ⚡ Vite for build tooling
- 🎨 Tailwind CSS for styling
- 🧭 React Router for navigation
- 📡 Axios for API communication

### Backend
- 🧠 Node.js with Express
- 🛢️ MongoDB with Mongoose
- 🔐 JWT for authentication
- 🔄 RESTful APIs

---

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Dhamodran16/FoodExpress.git
cd FoodExpress

 Install Dependencies
bash
Copy
Edit
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

Setup Environment Variables
Create .env files in both frontend/ and backend/ folders.

🔐 backend/.env
env
Copy
Edit
PORT=5000
MONGO_URI=mongodb://localhost:27017/swadexpress
JWT_SECRET=your_jwt_secret
🌐 frontend/.env
env
Copy
Edit
VITE_API_URL=http://localhost:5000/api

Run in Development Mode
bash
Copy
Edit
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
🌍 Deployment
Live demo: https://foodexpress-0djs.onrender.com/home

Frontend: Deployed as a static site using Render

Backend: Hosted with serverless functions on Render
