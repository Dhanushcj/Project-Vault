# Project Management Platform

A centralized platform for team project management with authentication, project tracking, credentials vault, video documentation, file uploads, and activity logs.

## Features

- 🔐 Authentication & Roles (Admin / Developer / Viewer)
- 📁 Project Management with tech stack, status, team assignment
- 🔗 GitHub & Deployment Links
- 🔑 Secure Credentials Vault with encryption
- 🎥 Video Documentation (YouTube/Loom)
- 📂 File & Document Uploads
- 📊 Dashboard with project overview
- 🔍 Search & Filter functionality
- 🧾 Activity Logs

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Encryption:** AES for credentials

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for frontend:
   ```bash
   cd project-management-platform
   npm install
   ```

3. Install dependencies for backend:
   ```bash
   cd backend
   npm install
   ```

4. Set up environment variables:
   - Copy `backend/.env` and update MongoDB URI, JWT secret, encryption key

5. Start MongoDB

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

2. Start the frontend:
   ```bash
   cd project-management-platform
   npm run dev
   ```
   App runs on http://localhost:3000

### First User

Register an admin user at /register, then change role in database if needed.

## API Endpoints

- POST /api/auth/register - Register user
- POST /api/auth/login - Login
- GET /api/projects - Get projects
- POST /api/projects - Create project
- GET /api/credentials/:projectId - Get credentials
- POST /api/credentials - Create credential
- And more...

## Database Schema

- Users: email, password, role, name
- Projects: name, description, techStack, status, assignedTeam, links
- Credentials: projectId, username, encrypted password, notes
- Videos: projectId, videoUrl, title
- Documents: projectId, fileUrl, fileName
- ActivityLog: userId, action, entityType, entityId

## Security

- Passwords hashed with bcrypt
- Credentials encrypted with AES
- JWT authentication
- Role-based access control
