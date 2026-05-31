# Sora Interview Platform

Sora is a cutting-edge platform designed to simulate the actual engineering loop, moving past isolated coding problems and into the pressure of real 1-on-1 technical interviews and adaptive AI-driven practice.

## 🚀 Core Features

- **🧠 Adaptive AI Tutor (Powered by Gemini)**  
  Search for any technical topic (e.g., "React Hooks", "Dynamic Programming"), and our AI will generate a unique, story-driven scenario just for you. Includes built-in explanations, starter code, and interactive exercises.
- **💻 Live IDE & Code Execution Engine**  
  Write code directly in our browser-based IDE (Monaco Editor). We support 14+ backend languages (Node.js, Python, Java, C++, etc.) powered by the JDoodle API, plus real-time client-side rendering for modern React code using Babel Standalone.
- **🤝 Live 1-on-1 Interviews**  
  Raise a ticket and get matched with a verified FAANG engineer. Code in our real-time shared IDE and experience the exact pressure of a real technical loop, complete with post-interview feedback and recordings.
- **🔐 Secure Authentication**  
  Enterprise-grade security using Google OAuth integration, email OTP verification, and strictly segregated JWT session management.

## 🛠 Tech Stack

- **Frontend:** React, TailwindCSS, Monaco Editor, Babel Standalone (for in-browser React compilation)
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Integrations:** Google Generative AI (Gemini 2.5 Flash), JDoodle Compiler API, Gmail API (for OTPs and Invites)

## 🔮 Upcoming Feature: Graceful API Fallbacks

To ensure that users can thoroughly test the platform even when third-party API quotas (like Gemini AI rate limits or JDoodle daily compile credits) are exhausted, we are currently implementing a **Graceful Mock Fallback Engine**. 

If the backend detects an API limit threshold, it will safely intercept the error and return high-quality Mock Data (e.g., a hardcoded "Mock Lesson" or a simulated "Mock Compile Success"). This guarantees 100% uptime for portfolio visitors and users trying to navigate the core UI flows!
