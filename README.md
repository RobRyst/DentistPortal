# 🦷 TannlegePortal – Appointment Booking & Administration Platform

A full-stack web application for managing dental appointments, treatments, and patient communication.
The system is designed to simulate a real-world dental clinic workflow, with secure authentication, role-based access, automated reminders, and administrative tooling.

Built to demonstrate full-stack development, backend architecture, frontend UX, and production-style features such as background jobs and notifications.

## 📌 Project Overview

TannlegePortal delivers a complete digital platform for a dental clinic, consisting of:

👤 Patient-facing booking interface
🛠️ Administrative management panel
⚙️ Secure backend API
🗄️ Relational database

The project implements:

📅 Appointment booking with availability management
👥 Role-based access (Admin, Provider, Patient)
✏️ Editing and management of existing appointments
📧 Email and in-app notifications
⏰ Automated appointment reminders (24h before)
💬 Integrated chatbot for user assistance

## 🚀 Tech Stack
## ⚙️ Application Stack

- React – Frontend web application
- TypeScript – Type-safe frontend development
- ASP.NET Core – Backend REST API
- Entity Framework Core – Data access layer
- MySQL – Relational database

## 🔐 Authentication & Authorization

- ASP.NET Identity
- JWT (JSON Web Tokens)
- Role-based access control (Admin / Provider / Patient)

## 🎨 UI & Styling

- Tailwind CSS – Utility-first styling
- Responsive layout for desktop and mobile
- Custom admin interfaces for data management

## 🔔 Notifications & Automation

- .NET BackgroundService – Scheduled reminder jobs
- Email notifications via SMTP
- In-app notification system

## 💬 External Integrations

- Noupe Chatbot – Embedded user support assistant
- Swagger – API documentation and testing

## ✨ Features
## 📅 Appointment Management

Patients can:

- Register and log in securely
- View available time slots
- Book, view, and cancel appointments
- Prevents overlapping or invalid bookings
- UTC-safe time handling with local display

## 🛠️ Admin & Provider Panel

- View all booked appointments across users
- Filter appointments by date and provider
- 
Edit:

- Appointment time
- Assigned treatment
- Cancel or update existing appointments
- Manage availability slots

## ⏰ Automated Reminders

- Background job checks upcoming appointments

Sends reminder:
- 24 hours before appointment start
  
Delivered via:

- Email
- In-app notification
- Each reminder is sent once per appointment

## 💬 Chatbot Assistance

- Embedded chatbot for user guidance
- Styled to match application branding
- Helps users navigate booking and information

## 🧱 Architecture

- Frontend and backend separated by REST API
  
Backend structured by:

- Controllers
- Domain entities
- DTOs
- Services
- Database enforces relational integrity
- Background services operate independently of HTTP requests
- The architecture is designed to resemble a real production system, with clear separation of concerns and scalable patterns.

## 🧠 What I Learned

- Full-stack application design from database to UI
- Secure authentication and authorization using ASP.NET Identity and JWT
- Handling time zones and date-sensitive logic correctly
- Implementing background jobs for scheduled tasks
- Designing admin tools for managing real-world data
- Integrating and configuring third-party widgets safely
- Coordinating frontend and backend state changes reliably

## 📄 Documentation Included

- API documentation via Swagger
- Database schema via Entity Framework migrations
- Frontend routing and role protection
- Background job logic for reminders
- Admin workflows for appointment editing
