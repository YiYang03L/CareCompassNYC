[README.md](https://github.com/user-attachments/files/27131241/README.md)
# CareCompass NYC 🗽

> AI-powered healthcare navigator for New York City's immigrant and underserved communities.

Built with [Claude Code](https://claude.ai/code) · Powered by [Google Gemini API](https://ai.google.dev/)
**Author:** YiYang Liu

🔗 **[Try the Live Demo](https://carecompass-715980078839.europe-west1.run.app)** — no signup required

---

## The Problem

Every year, hundreds of thousands of people in New York City avoid going to the doctor — not because they're healthy, but because they're afraid. Afraid of the bill. Afraid of the language barrier. Afraid their immigration status will be checked at the door.

**The data:**

- **46%** of likely undocumented immigrants in the US are uninsured, vs. 7% of naturalized citizens — *KFF / NYT 2025 Immigrant Health Survey* ([source](https://www.kff.org/immigrant-health/kff-new-york-times-2025-survey-of-immigrants-health-and-health-care-experiences-during-the-second-trump-administration/))
- **37%** of immigrants in high-risk NYC neighborhoods reported unmet healthcare needs; **29%** cut food spending to afford care — *Center for Migration Studies* ([source](https://cmsny.org/publications/nyc-health-061522/))
- NYC Care enrollment **dropped for the first time** in 2025 as immigrants cancelled clinic appointments fearing ICE activity — *The City NYC* ([source](https://www.thecity.nyc/2025/08/12/ice-fear-undocumented-immigrant-medical-services-nyccare/))
- NYC launched a **$135M medical debt relief program** in 2025, cancelling debt for 75,000+ working-class New Yorkers — *NYC Mayor's Office* ([source](https://www.nyc.gov/site/dca/news/028-25/mayor-adams-cancels-nearly-135-million-medical-debt-working-class-new-yorkers-celebrates))

**The resources exist.** NYC Care, Medicaid, FQHCs, Emergency Medicaid — free and sliding-scale care is available to *everyone* regardless of immigration status. NYC Health + Hospitals alone serves 1.4 million patients, nearly half a million uninsured.

**The barrier is information** — knowing where to go, what you qualify for, and being able to ask in your own language.

**CareCompass NYC exists to close that gap.**

---

## What It Does

| Feature | Description |
|---------|-------------|
| 🤖 **AI Health Navigator** | Conversational AI that answers questions about healthcare, insurance, and NYC resources in plain language, grounded in real NYC clinic data |
| 🗣️ **Live Voice Session** | Talk to CareCompass like a phone call — real-time speech recognition + browser-native voice response, no extra latency |
| 📸 **Insurance Card Decoder** | Upload a photo of your insurance card — AI explains every term (Premium, Deductible, Copay) with concrete dollar examples |
| 🗺️ **Facility Map** | Search by ZIP code → see free and low-cost clinics on a live map with color-coded pins |
| 🌍 **7 Languages** | Full UI and AI responses in English, Chinese (中文), Spanish (Español), Hindi (हिन्दी), Arabic (العربية), Russian (Русский), French (Français) |
| 🏥 **NYC Resource Hub** | Direct links to NYC Care, Medicaid application, Emergency Medicaid, and FQHC finder |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Frontend)                    │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  Chat UI      │  │  Voice Session │  │  ZIP Code Map    │  │
│  │  (marked.js)  │  │  Web Speech    │  │  Leaflet.js +    │  │
│  │               │  │  API (STT+TTS) │  │  OpenStreetMap   │  │
│  └──────┬────────┘  └──────┬────────┘  └────────┬─────────┘  │
│         │                  │                     │            │
└─────────┼──────────────────┼─────────────────────┼────────────┘
          │  REST API calls  │                     │
┌─────────▼──────────────────▼─────────────────────▼────────────┐
│                   FastAPI Backend (Python)                      │
│                                                                 │
│   POST /api/chat           →  RAG retrieval → Gemini chat       │
│   POST /api/analyze-image  →  Gemini multimodal (vision)        │
│   GET  /api/facilities/search  →  Local JSON facility database  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Google Gemini API (OpenAI-compatible endpoint)      │
│                                                                  │
│   gemini-2.5-flash    ·  Multilingual chat + image analysis      │
└──────────────────────────────────────────────────────────────────┘
```

**Voice (STT + TTS):** Browser-native Web Speech API — zero latency, no API costs
**Map tiles:** OpenStreetMap (free, no API key)

---

## RAG Pipeline

CareCompass uses a **lightweight Retrieval-Augmented Generation** flow over a curated dataset of 24 NYC healthcare facilities:

1. **Retrieve** — multi-signal scoring on the user message: insurance keywords (+5), ZIP prefix match (+4), borough match (+3), language match (+2), tag overlap (+1)
2. **Augment** — top-k facilities (with name, address, phone, accepted insurance, languages, hours) injected into the system prompt
3. **Generate** — Gemini responds grounded in the retrieved facility data, citing real clinic names and contacts instead of hallucinating

Multilingual borough aliases (e.g. `皇后区` → `queens`, `布鲁克林` → `brooklyn`) ensure retrieval works across all 7 supported languages. If no facilities match, the LLM falls back to general guidance — graceful degradation, no spurious recommendations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML · CSS · JavaScript |
| Backend | Python · FastAPI · uvicorn |
| AI (Chat + Vision) | Google Gemini 2.5 Flash (OpenAI-compatible endpoint) |
| Voice (STT + TTS) | Web Speech API (browser-native) |
| Map | Leaflet.js + OpenStreetMap |
| Deployment | Docker · Google Cloud Run |
| AI Dev Tool | Claude Code · Trae |

---

## Languages Supported

🇺🇸 English · 🇨🇳 中文 · 🇪🇸 Español · 🇮🇳 हिन्दी · 🇸🇦 العربية · 🇷🇺 Русский · 🇫🇷 Français

These 7 languages represent the most spoken languages among NYC's immigrant communities (US Census 2020).

---

## Running Locally

### Prerequisites
- Python 3.10+
- A free [Google Gemini API key](https://aistudio.google.com/apikey) (1500 free requests/day on `gemini-2.5-flash`)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YiYang03L/CareCompassNYC.git
cd CareCompassNYC

# 2. Set up backend
cd backend
pip install -r requirements.txt

# 3. Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# 4. Start the backend
uvicorn main:app --reload --port 8000

# 5. In a new terminal, start the frontend
cd ../frontend
python3 -m http.server 3000

# 6. Open http://localhost:3000
```

---

## Inclusivity by Design

- **No immigration status check** — all resources shown are available regardless of status
- **7 UN languages** — covers 95%+ of NYC's non-English speaking immigrant population
- **Voice-first** — works even for users with low literacy in any language
- **Free resources prioritized** — NYC Care, FQHCs, and sliding-scale clinics shown first
- **Insurance-agnostic** — useful whether you have Medicaid, Medicare, private insurance, or nothing

---

## Facilities Database

24 real NYC health facilities including:
- NYC Health + Hospitals public hospitals (all 5 boroughs)
- Federally Qualified Health Centers (FQHCs) — free/sliding scale
- Major private hospitals (NYU Langone, Mount Sinai, NYP)
- Urgent care centers (CityMD)

All facilities include: address, phone, website, accepted insurance types, languages spoken, hours, and GPS coordinates for the map.

---

## Deployment

Live at **[carecompass-715980078839.europe-west1.run.app](https://carecompass-715980078839.europe-west1.run.app)** — deployed on Google Cloud Run via Docker, with continuous deployment from this repository.

---

## Author

**YiYang Liu**
Built with [Claude Code](https://claude.ai/code) + [Google Gemini API](https://ai.google.dev/)
