---
title: AI Assistant & Speech Hub
tags:
  - module
  - ai
  - speech
  - groq
  - whisper
  - tool-calling
created: 2026-10-13
status: evergreen
---

# 🤖 AI Assistant & Speech Hub

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Interacts With: [[Quotation Engine]], [[Booking and Operations Hub]], [[Dual Audience and Currency Engine]]

---

## 📌 Overview
The **AI Assistant & Speech Hub** embeds conversational intelligence directly into TourBiller. Using LLMs (Groq / Gemini) and automated function/tool-calling, it enables operators to query fleet availability, draft quotations, convert currencies, and dictate tour notes hands-free using voice recognition.

---

## 🔑 Key Features & Components

### 1. Conversational Tool-Calling Architecture
Built using the Vercel AI SDK (`@ai-sdk/react` and `ai`), the agent executes multi-step tool calls directly against the PostgreSQL database:
- `getVehicleStats`: Returns counts of active vs total fleet vehicles.
- `searchCustomers`: Finds existing customer contact records by name substring.
- `addCustomer`: Automatically registers a new customer profile.
- `getLiveExchangeRate`: Fetches current Forex rates (USD, EUR, GBP) to quote foreign guests accurately.
- `createBooking`: Directly creates reservations from chat dialogue.
- `createQuotation`: Formulates full quotations from conversational prompts.

### 2. Speech-to-Text Voice Dictation
- **Browser MediaRecorder**: Captures audio streams directly in `ChatAssistant.tsx`.
- **Whisper Transcription Engine (`/api/transcribe`)**: Converts captured audio into clean text and feeds it directly into prompt input bars or form fields.
- Ideal for fast operator input when taking inquiries over the phone.

### 3. Business Knowledge Injection (`src/agent-knowledge.md`)
The AI system prompt enforces the platform's core tenets:
- **Dual Audience Principles**: Always adopts professional international tourism terminology (e.g., replaces "driver bata" with "Driver Accommodation & Meals").
- Multi-currency transparency rules.

---

## 📂 Source Code References
- Floating Chat UI: `src/components/ChatAssistant.tsx`, `src/components/QuotationAIChat.tsx`
- API Route: `src/app/api/chat/route.ts`
- Transcription Route: `src/app/api/transcribe/route.ts`
