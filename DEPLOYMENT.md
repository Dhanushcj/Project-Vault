# 🚀 Deployment Guide: Project Vault

This guide covers how to deploy the **Project Vault** platform to production.

## 📋 Prerequisites
- A **MongoDB Atlas** account (Free tier is fine).
- An **SMTP Service** (Gmail, SendGrid, or similar) for employee invitations.
- A Node.js compatible host (Vercel, AWS, or DigitalOcean).

---

## 1. Database Setup (MongoDB Atlas)
1. Create a Project and Cluster on MongoDB Atlas.
2. In **Network Access**, allow your server's IP (or `0.0.0.0/0` for global access).
3. In **Database Access**, create a user with read/write permissions.
4. Copy the connection string for your `.env` file.

## 2. Backend Deployment
1. Upload the `/backend` folder to your server (e.g., a VPS or a Node.js host like Render/Heroku).
2. Set up the Environment Variables from the provided template [`.env.production.template`](./.env.production.template).
3. Run `npm install --production`.
4. Start the server using `npm start`.

## 3. Frontend Deployment (Vercel Recommended)
1. Connect your repository to **Vercel**.
2. Set the **Root Directory** to the main folder.
3. Add the following Environment Variable:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://api.yourbrand.com/api`).
4. Click **Deploy**.

## 🛡️ Security Check
- [ ] **JWT_SECRET**: Is it a long, random string?
- [ ] **ADMIN_PASSWORD**: Did you change it from the default?
- [ ] **SSL**: Is your API running over HTTPS? (Highly Recommended).
- [ ] **SMTP**: Have you tested that employee invitation emails are actually arriving?

## 🚀 Performance
- Compression is enabled by default in the backend.
- Images in the sidebar are optimized for delivery.

---
**Need help?** Just ask the Antigravity AI!
