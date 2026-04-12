# Employee Leave & Attendance Management System

A full-stack HR management system designed to manage employee leave requests, attendance tracking, and workforce data with secure role-based access.

---

## Project Overview

This system provides a complete solution for managing employee operations.

### Admin Features:

* Approve or reject leave requests
* View all employee records
* Monitor attendance data

### Employee Features:

* Apply for leave (Casual, Sick, Paid)
* Track leave status
* Mark daily attendance
* View attendance and leave history

---

## Tech Stack & Justification

### Frontend:

* React (Vite) – Fast development and optimized performance
* Tailwind CSS – Clean and responsive UI

### Backend:

* Node.js + Express – Lightweight and scalable REST APIs
* MongoDB + Mongoose – Flexible NoSQL database

### Authentication:

* JWT (JSON Web Token) – Secure and stateless authentication

---

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/deepesh67/HR-Management-System.git
cd HR-Management-System
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Note: Do not commit your actual `.env` file to GitHub.

---

## Deployment

Frontend: To be deployed
Backend: To be deployed

---

## API Endpoints

### Auth

* POST /api/auth/register → Register user
* POST /api/auth/login → Login

### Leave

* POST /api/leave/apply → Apply leave
* GET /api/leave/my → Get user leaves
* PUT /api/leave/approve/:id → Approve/Reject leave (Admin)
* GET /api/leave/all → Get all leaves

### Attendance

* POST /api/attendance/mark → Mark attendance
* GET /api/attendance/my → Get own attendance
* GET /api/attendance/all → Admin view

---

## Database Models

### User

* name
* email
* password
* role (admin / employee)
* leaveBalance

### Leave

* userId
* leaveType
* startDate
* endDate
* totalDays
* status

### Attendance

* userId
* date
* status

---

## Project Structure

```
root/
│── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│
│── frontend/
│   ├── pages/
│   ├── components/
│   ├── services/
│
│── README.md
```

---

## Features Implemented

* JWT Authentication
* Role-based Access Control
* Leave Management System
* Attendance Tracking
* Leave Balance Calculation
* Protected Routes

---

## Credentials

ADMIN
Email: [deepesh4938@gmail.com](mailto:deepesh4938@gmail.com)
Password: 123456

EMPLOYEE
Email: [Khushijangid1902@gmail.com](mailto:Khushijangid1902@gmail.com)
Password: 1234567

---

## AI Tools Declaration

This project was developed with assistance from AI tools such as ChatGPT for:

* Debugging issues
* Code structuring
* UI improvements

All core logic and implementation were written and customized manually.

---

## Known Limitations

* Same browser shares login session (localStorage behavior)
* No email notifications implemented
* No pagination for large datasets

---

## Time Spent

Approximately 12–15 hours were spent building this project.

---

## Conclusion

This project demonstrates full-stack development skills including authentication, API design, database management, and responsive UI development.

---
