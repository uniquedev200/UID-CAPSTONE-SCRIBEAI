# ScribeAI - Meeting Transcription Platform

## Overview

Full-stack web application with a professional SaaS-style frontend inspired by Stripe, Apple, and Otter.ai. Uses Node.js/Express backend with Prisma ORM and vanilla HTML/CSS/JS frontend.

## Architecture

```
capstone/
├── index.html          # Landing page with bento grid
├── features.html      # Features showcase
├── pricing.html       # Pricing tiers
├── contact.html       # Contact form
├── auth.html          # Login/Signup with Google OAuth
├── dashboard.html     # Protected dashboard (Otter.ai style)
├── transcript.html    # Meeting detail view (split-screen)
├── style.css          # Elite SaaS design system
├── mockData.js        # Sample transcripts & state
├── ui.js              # State management & page transitions
├── config.js          # Backend API URL
├── SPEC.md
└── backend/
    ├── package.json
    ├── server.js      # Express + Prisma + Groq API
    ├── prisma/
    │   ├── schema.prisma
    │   └── client.js
    └── .env
```

## Design System

**Visual Style:** Stripe/Apple/Otter.ai inspired
- Deep navy background (#0f172a)
- Sky blue accent (#38bdf8) + Indigo secondary (#6366f1)
- Glassmorphism with backdrop-filter blur
- Soft shadows (Apple-style)
- Subtle mesh gradient animations

**Typography:** Inter font family, tight letter-spacing for headings

## Features

### Frontend
- **Landing Page:** Animated hero with mesh gradient, bento grid feature cards
- **Dashboard:** Slim sidebar with profile, stats grid, meeting cards with sentiment badges
- **Transcript View:** Split-screen layout - full transcript + AI summary, action items, speaker chart, contextual chat
- **Chat Widget:** Floating assistant with slide-in animation
- **Responsive:** Mobile hamburger menu, collapsible sidebar

### Backend
- **Auth:** Email/password + Google OAuth via Passport
- **API:** RESTful endpoints for contacts, transcripts, chat
- **Groq Integration:** AI chatbot with contextual responses
- **Prisma ORM:** Type-safe database access

## Setup

### Backend
```bash
cd backend
npm install
npx prisma db push        # Create tables
npm run dev               # Start server (port 3000)
```

### Frontend
```bash
npx serve . -p 5500       # Serve from root directory
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/session` | Get current user |
| GET | `/auth/google` | Google OAuth |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/transcripts` | List user transcripts |
| GET | `/api/transcripts/:id` | Get transcript detail |
| POST | `/api/chat` | Chat with AI |

## Sample Data

Mock transcripts auto-populate via localStorage. Includes:
1. Product Strategy Q4 (positive sentiment)
2. Technical Debt Discussion (neutral sentiment)
3. Client Feedback - Meridian Corp (positive)

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript ES6+
- **Backend:** Node.js, Express, Passport.js
- **Database:** PostgreSQL via Prisma ORM
- **AI:** Groq Cloud API (llama-3.3-70b-versatile)
- **Charts:** Chart.js
- **Auth:** Session-based + Google OAuth
