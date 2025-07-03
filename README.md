<h1 align="center">
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTG6edcHS69ZxImgiIzLmaGq3b3q3zTOlLkiQ&s" alt="FoodExpress Logo" width="120" />
  <br>
  FoodExpress – Full-Stack Food Delivery App
  <br>
</h1>

<p align="center">
  A modern food delivery application built using React, TypeScript, Node.js, and MongoDB. Features include user authentication, restaurant listings, order tracking, and real-time updates.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-4.x-blue.svg?style=flat-square" alt="TypeScript Version">
  </a>
  <a href="https://reactjs.org/">
    <img src="https://img.shields.io/badge/React-18.x-blue.svg?style=flat-square" alt="React Version">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-4.x-black.svg?style=flat-square" alt="Express Version">
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-6.x-green.svg?style=flat-square" alt="MongoDB Version">
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/TailwindCSS-3.x-cyan.svg?style=flat-square" alt="Tailwind Version">
  </a>
  <a href="https://github.com/Dhamodran16/FoodExpress/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Dhamodran16/FoodExpress?style=flat-square" alt="License">
  </a>
</p>

---

## 🚀 Key Features

* 🔐 User registration and login using JWT
* 🏪 Browse and search restaurants
* 📋 Manage menus and categories
* 🛒 Add items to cart and place orders
* 📦 Order tracking with real-time updates
* 📱 Mobile-friendly responsive UI
* 👤 Role-based access (Admin/User)
* ⚙️ Environment config via `.env` files

---

## 🧱 Tech Stack

### Frontend

* **React** with **TypeScript**
* **Vite** as the build tool
* **Tailwind CSS** for modern UI styling
* **React Router** for navigation
* **Axios** for API communication

### Backend

* **Node.js** with **Express**
* **MongoDB** with **Mongoose**
* **JWT** for user authentication
* **RESTful API** architecture

---

## 📁 Folder Structure

```
FoodExpress/
├── frontend/           # React + Vite client
├── backend/            # Node.js + Express API
├── .env                # Backend environment variables
├── .gitignore
├── README.md
├── package.json
└── LICENSE
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Dhamodran16/FoodExpress.git
cd FoodExpress
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Setup Environment Variables

Create `.env` files for both frontend and backend.

#### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodexpress
JWT_SECRET=your_jwt_secret
```

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧲 Running the App

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd ../frontend
npm run dev
```

### App will run on:

* Frontend: [http://localhost:5173/](http://localhost:5173/)
* Backend: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🌍 Deployment

* 🔗 **Live Demo**: [https://foodexpress-0djs.onrender.com/home](https://foodexpress-0djs.onrender.com)
* **Frontend**: Deployed as static site
* **Backend**: Deployed as serverless functions on Render

---

## 👨‍💼 Author

Made with 💻 by [Dhamodran](https://github.com/Dhamodran16)

<p align="center">
  <sub>Feel free to ⭐ this repo if you find it useful!</sub>
</p>
