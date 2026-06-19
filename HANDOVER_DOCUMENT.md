# BludWear Project Handover Document

## 💰 Payment Details
* **Total Project Cost:** ₹15,000
* **Amount Paid Advance:** ₹3,000
* **Pending Balance:** ₹12,000

---

## 🔐 Credentials & Accounts

### 1. Vercel (Frontend Hosting)
Vercel is where your React frontend application is hosted and deployed.
* **Email:** wearblud@gmail.com
* **Password:** Bludwear@987

### 2. Supabase (Database & Backend API)
Supabase handles your user authentication, PostgreSQL database, edge functions, and image storage.
* **Email:** wearblud@gmail.com
* **Password:** Bludwear@987

### 3. Shiprocket (Shipping & Logistics)
Shiprocket handles all your live shipping rates, courier assignment, and package tracking.
* **Phone:** 7302572624
* **Email:** hb3976861@gmail.com
* **Password:** Bludwear@987

---

## 🚀 Summary of Work Completed

We have built a fully customized, scalable, and automated e-commerce platform from the ground up. 

**Core Technical Upgrades:**
* **Frontend:** Developed a lightning-fast React application using Vite. Designed a premium, dark-themed, ultra-modern UI with smooth micro-animations tailored to the "BludWear" brand identity.
* **Database Migration:** Completely removed the outdated Firebase architecture and migrated the entire platform to **Supabase** for enterprise-grade security and speed.

**E-Commerce Features:**
* **Authentication:** Secure user login via Email/Password and Google OAuth.
* **Cart & Wishlist:** Fully persistent cart and wishlist functionality tied directly to user accounts.
* **Razorpay Integration:** Secure, seamless checkout for Prepaid orders (UPI, Credit/Debit Cards, Netbanking).
* **Cash On Delivery (COD):** Integrated COD workflows with proper database tracking.

**Shiprocket Automation Engine:**
* **Live Rate Calculation:** Custom Supabase Edge Function that connects to Shiprocket in real-time. Whenever a user types their Pincode at checkout, it dynamically calculates the exact shipping cost.
* **Auto-Booking:** The moment an order is successfully placed (Prepaid or COD), the system automatically pushes the order details to Shiprocket. No manual data entry required!
* **Live Tracking Webhooks:** Whenever Shiprocket updates a delivery status (e.g., "Shipped", "Out for Delivery", "Delivered"), it sends a webhook to our custom Edge Function, which instantly updates the order status in your database.

---

## 🛠️ Admin Panel Operations Guide

The Admin Panel is a secure, private dashboard built into the website for you to manage your business operations.

### How to Access:
Only accounts that have their role set to `admin` in the Supabase database can access the `/admin` route on the website.

### Capabilities:
1. **Product & Inventory Management:**
   * **Add New Products:** Upload images directly to Supabase storage, set prices, and write descriptions.
   * **Manage Stock:** Update the available inventory count for each size/color variant. The system automatically deducts stock when customers purchase items.
   * **Edit/Delete:** Hide or remove products that are out of season or discontinued.
   
2. **Order Management:**
   * **View All Orders:** See a complete list of every order placed, including customer name, address, and contact info.
   * **Payment Status:** Instantly see if an order is "Paid" (Razorpay) or "Pending" (COD).
   * **Shipping Status:** Because of the Shiprocket Webhook integration, you can monitor the real-time shipping status of every package directly from this dashboard without having to log into Shiprocket separately.
   * **Manual Overrides:** Manually update order statuses (e.g., cancelling a fraudulent order or refunding an item).

---

*Thank you for trusting me with the development of BludWear. The platform is now highly optimized, automated, and ready to scale to thousands of customers!*
