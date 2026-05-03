# 🍕 FOODZONE

![FOODZONE Banner](https://via.placeholder.com/1000x250?text=FOODZONE+Food+Delivery+Platform)

A full-stack, end-to-end food delivery web application designed to handle customer orders, admin management, integrated payments, and seamless menu navigation.

## 🚀 Features
- **User Frontend:** Browse menus, dynamic cart management, location/address persistence, and place orders.
- **Admin Dashboard:** Add/remove food items, monitor real-time orders, and track user statuses.
- **Payments:** Integrated Stripe checkout, Cash on Delivery, UPI, and NetBanking options.
- **Authentication:** Secure JWT-based login for users and role-based validation for admins.
- **Chatbot:** AI/Mock integrated chat assistance for an enhanced user experience.

## 🛠️ Tech Stack & Versions
To avoid execution conflicts, the recommended development environment is:
- **Node.js:** v18.x or v20.x
- **React.js / Vite:** v18.3.1 / v6.4.1 
- **Express.js:** v4.19.2
- **MongoDB Database:** Mongoose v8.6.3
- **Stripe SDK:** v16.9.0
- **Tailwind / Standard CSS:** Custom CSS architecture

## 📋 Application Workflow
1. **User Discovery:** Customer navigates the menu utilizing category filters.
2. **Dynamic Cart:** Customer adds desired foods spanning across categories without page refresh.
3. **Authentication Boundary:** Unauthenticated users are prompted to login/register to save their cart details into the database.
4. **Checkout Engine:** Customer inputs their address, calculates final total including GST.
5. **Payment Gateway:** Navigates to a 4-option payment screen holding the order in memory. Approving the payment posts to the Stripe API or records COD.
6. **Admin Funnel**: The Admin Dashboard immediately registers the order state as "Pending", allowing staff to rotate the shipment to "Out for delivery".

## ⚙️ Quick Start

**1. Clone the repository**
```bash
git clone https://github.com/CheboluAswini/FOODZONE.git
cd FOODZONE
```

**2. Setup backend**
```bash
cd backend
npm install
npm run dev # Runs on port 5000
```
*Don't forget to configure your `.env` containing your `MONGODB_URI`, `JWT_SECRET`, and `STRIPE_SECRET_KEY`.*

**3. Setup frontend**
```bash
cd frontend
npm install
npm run dev # Runs on port 5174
```

**4. Setup admin**
```bash
cd admin
npm install
npm run dev # Runs on port 5173
```

## 🤖 ML Recommendations (Real Model)
The project includes a Python ML service that trains an implicit-feedback recommendation model from MongoDB order history.

**Environment variables**
- `ML_SERVICE_URL` (backend → ML service URL)
- `ML_ADMIN_KEY` (shared secret for training endpoint)
- `MONGODB_URI` (ML service DB connection)

**Train the model on demand**
```bash
POST /api/ml/train
Header: x-ml-admin-key: <ML_ADMIN_KEY>
```

**Fetch recommendations**
```bash
GET /api/ml/recommendations
Header: token: <JWT>
```
