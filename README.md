# 🐍 PyQuiz Pro - AI Powered Technical Interview Dashboard

PyQuiz Pro is a premium, high-performance technical evaluation dashboard tailored for testing Python programming skills. Built with a futuristic cyber-dark aesthetic, it provides instant assessment on control structures, loops, and logic validation backed by a Python FastAPI engine and an AI recruitment analyst.

---

## 🚀 Features

- **AI Recruiter Feedback:** Generates immediate, intelligent analysis on user performance upon interview completion.
- **Smart Code Highlighting:** Automatically detects Python code blocks (`for loops`, `while loops`, etc.) within question titles and renders them inside an elegant, dark-themed simulated IDE window.
- **Instant Handshake Validation:** Real-time error handling with visual cues if the Python backend connection is disrupted.
- **Premium Cyberpunk UX/UI:** Designed with a clean, responsive dark interface using Next.js 15+, Tailwind CSS, and Shadcn UI.
- **Hydration-Safe Architecture:** Built with robust suppressions for common browser-extension conflicts, ensuring a seamless load sequence.

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI (Radix Primitives)
- **Icons:** Lucide React

### Backend

- **Engine:** FastAPI (Python)
- **Server:** Uvicorn

---

## 📦 Getting Started

### Prerequisites

Make sure you have **Node.js** and **Python 3.10+** installed on your system.

### 1. Setup the Backend (FastAPI)

Navigate to your backend directory and run the Uvicorn server:

```bash
# Navigate to backend (if applicable)
cd backend

# Start the python uvicorn instance
uvicorn main:app --reload
```
