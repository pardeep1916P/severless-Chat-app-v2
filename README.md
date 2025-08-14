# 💬⚡ Serverless Chat Application – V2

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Serverless](https://img.shields.io/badge/Serverless-FD5750?style=for-the-badge&logo=serverless&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white)

**Frontend:** 🚀 Vercel (React + TypeScript + Vite)  
**Backend:** ☁️ AWS Lambda (**Server**) + API Gateway (WebSocket)  

💼 **My Role – Cloud Engineer**  
- Designed & deployed the **entire AWS serverless architecture** from scratch.  
- Integrated **frontend with backend WebSocket API** for real-time chat.  
- Implemented **secure IAM policies** and CI/CD pipelines for automated deployment.  
- Ensured **high availability, scalability, and cost-efficiency**.  

> *(Frontend & backend application code was sourced from open repositories — AWS infrastructure & deployment was fully designed and implemented by me)*

---

## 📌 Overview

A **real-time chat application** built with a **fully serverless AWS architecture**.  
- Frontend hosted on **Vercel** for global, fast delivery.  
- Backend uses **AWS Lambda (as the server)** and **API Gateway WebSockets** for instant communication.  
- **DynamoDB** is used **only for tracking active WebSocket connections** (no message history stored).  

---

## 🏗️ Cloud Architecture

```plaintext
      🖥️ User Browser
            │
            ▼
   🌐 Vercel (Frontend)
            │
            ▼
🔌 API Gateway (WebSocket API)
            │
            ▼
⚙️ AWS Lambda (Server - Handles Events)
            │
            ▼
📂 DynamoDB (Tracks Active Connections)
```

---

## 🚀 Features
- Real-time messaging using **API Gateway WebSockets**  
- **AWS Lambda** acts as the server to process events  
- **DynamoDB** for connection tracking only (no message storage)  
- Auto-scaling backend with AWS Lambda  
- Secure communication via IAM & API Gateway settings  
- Fully managed serverless infrastructure — no physical servers to maintain  

---

## 🛠️ AWS Services & Responsibilities

| Service                     | Purpose                                           |
|-----------------------------|---------------------------------------------------|
| API Gateway (WebSocket)     | Manage real-time connections & route messages     |
| AWS Lambda (Server)         | Handle connect, message, and disconnect events    |
| DynamoDB                    | Store active WebSocket connection IDs             |
| IAM                         | Implement least-privilege access control          |
| CloudWatch                  | Log monitoring & error tracking                   |

**Cloud Engineer Contributions:**
- Designed **API Gateway → Lambda → DynamoDB** workflow  
- Configured secure IAM roles & policies  
- Set up **CloudWatch monitoring** for logs & alerts  
- Integrated **Vercel frontend** with backend WebSocket endpoint  

---

## 🌐 Live Deployment
- **Frontend (Vercel):** https://severless-chat-app-v2.vercel.app 
- **WebSocket API Endpoint(backend required):** wss://<your-api-id>.execute-api.<region>.amazonaws.com/dev  

---

## 🧪 Local Development (Backend)

```bash
# 1️⃣ Clone the repo
git clone https://github.com/pardeep1916P/severless-Chat-app-v2.git
cd severless-Chat-app-v2

# 2️⃣ Install dependencies
cd serverBackend
npm install

# 3️⃣ Run locally (AWS credentials required)
serverless offline
# or
sam local start-api
```

---

## 📂 Project Structure
```
src/              # Frontend (React + TypeScript + Vite)
serverBackend/    # AWS Lambda backend code
index.html        # Frontend entry point
vite.config.ts    # Vite configuration
tsconfig.json     # TypeScript configuration
package.json      # Dependencies
```

---

## ✅ Cloud Engineer Impact
- Delivered a **cost-effective, real-time communication platform**  
- Designed a **scalable & secure AWS WebSocket API**  
- Eliminated server maintenance using fully managed AWS services  
- Integrated **monitoring & logging** for operational visibility  
