from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
import re

from prompts import SYSTEM_PROMPT
from config import GEMINI_API_KEY, GEMINI_API_BASE, GEMINI_MODEL

app = FastAPI(title="CareCompass NYC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"

class ImageAnalysisRequest(BaseModel):
    image_data: str
    mime_type: Optional[str] = "image/jpeg"
    language: Optional[str] = "en"


# ── Gemini API (OpenAI-compatible endpoint) ───────────────────────────────────
async def call_gemini_chat(messages: list, model: str = None) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    url = f"{GEMINI_API_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {GEMINI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model or GEMINI_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini API error {response.status_code}: {response.text}"
            )
        data = response.json()
        return data["choices"][0]["message"]["content"]


# ── Language helper ───────────────────────────────────────────────────────────
LANGUAGE_NAMES = {
    "en": "English",
    "zh": "Chinese (Simplified)",
    "es": "Spanish",
    "hi": "Hindi",
    "ar": "Arabic",
    "ru": "Russian",
    "fr": "French",
}

def language_instruction(lang: str) -> str:
    # 'auto' means voice mode — respond in whatever language the user spoke
    if not lang or lang == "auto":
        return "\n\nIMPORTANT: Detect the language of the user's message and respond in that same language."
    name = LANGUAGE_NAMES.get(lang, "English")
    return f"\n\nIMPORTANT: The user's preferred language is {name}. Please respond in {name}."


# ── Chat endpoint ─────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # RAG step 1 — Retrieve: rank NYC facilities relevant to the user message
        retrieved = retrieve_facilities(
            request.message, request.language or "en", top_k=5
        )
        # RAG step 2 — Augment: inject retrieved facility data into the system prompt
        system = (
            SYSTEM_PROMPT
            + language_instruction(request.language)
            + format_facilities_context(retrieved)
        )
        # RAG step 3 — Generate: LLM answers grounded in retrieved context
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": request.message}
        ]
        response = await call_gemini_chat(messages)

        # UI cards mirror what was actually retrieved (empty = no cards shown)
        facilities = retrieved[:3]

        return {
            "response": response,
            "facilities": facilities,
            "language": request.language
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Image analysis ────────────────────────────────────────────────────────────
@app.post("/api/analyze-image")
async def analyze_image(request: ImageAnalysisRequest):
    try:
        lang_note = language_instruction(request.language)
        analysis_prompt = f"""Analyze this insurance card or medical bill image and extract ALL relevant information.

For insurance cards, explain each term in plain language using only the user's language (no bilingual labels):
- Premium: the monthly payment to keep coverage active
- Deductible: what the person pays out-of-pocket before insurance starts covering costs
- Copay: a fixed fee paid each visit to a provider
- Coinsurance: the percentage split after the deductible is met
- Out-of-Pocket Maximum: the most the person will ever pay in a year
- In-Network vs Out-of-Network: cost difference between contracted and non-contracted providers
- Insurance company name and plan type (HMO/PPO/EPO)

For each term found on the card, give a concrete dollar example using the actual numbers shown.
For medical bills, itemize each charge and explain what it means.

CRITICAL: Respond entirely in the user's language. Do NOT mix in any other language or show bilingual labels.{lang_note}"""

        mime = request.mime_type or "image/jpeg"
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": analysis_prompt},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{request.image_data}"}}
            ]}
        ]
        response = await call_gemini_chat(messages)
        return {"response": response}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── STT/TTS now handled in the browser via Web Speech API ─────────────────────
# (legacy MiniMax STT/TTS endpoints removed; frontend uses
#  webkitSpeechRecognition + window.speechSynthesis directly)


# ── NYC facilities data ───────────────────────────────────────────────────────
import os

FACILITIES_FILE = os.path.join(os.path.dirname(__file__), "data", "health_facilities.json")

def load_facilities():
    try:
        with open(FACILITIES_FILE) as f:
            return json.load(f)["facilities"]
    except Exception:
        return []

KEYWORDS_UNINSURED = ["no insurance", "uninsured", "can't afford", "free clinic",
                       "没有保险", "免费", "sin seguro", "free care", "nyc care"]
KEYWORDS_MEDICAID  = ["medicaid", "low income", "low-income", "government insurance",
                       "低收入", "医疗补助"]
KEYWORDS_HOSPITAL  = ["hospital", "clinic", "doctor", "urgent care", "er ",
                       "emergency", "医院", "诊所", "医生"]

def get_relevant_facilities(user_msg: str, ai_response: str) -> list:
    combined = (user_msg + " " + ai_response).lower()
    all_facilities = load_facilities()
    matched = []

    if any(k in combined for k in KEYWORDS_UNINSURED):
        matched = [f for f in all_facilities if "nyc_care" in f.get("accepts", [])
                   or "uninsured" in f.get("accepts", [])][:3]
    elif any(k in combined for k in KEYWORDS_MEDICAID):
        matched = [f for f in all_facilities if "medicaid" in f.get("accepts", [])][:3]
    elif any(k in combined for k in KEYWORDS_HOSPITAL):
        matched = all_facilities[:3]

    return matched


# ── RAG: retrieve + rank facilities for prompt injection ─────────────────────
# Multilingual borough name → canonical English (matches data in health_facilities.json)
BOROUGH_ALIASES = {
    "manhattan": "manhattan", "曼哈顿": "manhattan",
    "bronx": "bronx", "布朗克斯": "bronx",
    "brooklyn": "brooklyn", "布鲁克林": "brooklyn",
    "queens": "queens", "皇后区": "queens", "法拉盛": "queens",
    "staten island": "staten island", "史泰登岛": "staten island",
}

def retrieve_facilities(user_msg: str, user_lang: str = "en", top_k: int = 5) -> list:
    """Score + rank facilities against the user's message.

    Content signals (required): insurance keywords, borough mention, ZIP match.
    Tiebreaker signals (weak): language support, tag/type keyword overlap.
    A facility is included only if it matches at least one content signal,
    so generic queries return an empty list instead of the first three.
    """
    msg = user_msg.lower()
    all_f = load_facilities()

    wants_uninsured = any(k in msg for k in KEYWORDS_UNINSURED)
    wants_medicaid = any(k in msg for k in KEYWORDS_MEDICAID)

    zip_match = re.search(r"\b(\d{5})\b", msg)
    target_zip = zip_match.group(1) if zip_match else None

    target_borough = next(
        (canonical for alias, canonical in BOROUGH_ALIASES.items() if alias in msg),
        None,
    )

    scored = []
    for f in all_f:
        content = 0
        tiebreak = 0
        if wants_uninsured and (
            "nyc_care" in f.get("accepts", []) or "uninsured" in f.get("accepts", [])
        ):
            content += 5
        if wants_medicaid and "medicaid" in f.get("accepts", []):
            content += 5
        if target_zip and target_zip[:3] == f.get("zipcode", "")[:3]:
            content += 4
        if target_borough and target_borough == f.get("borough", "").lower():
            content += 3
        if user_lang and user_lang in f.get("languages", []):
            tiebreak += 2
        tags_blob = (" ".join(f.get("tags", [])) + " " + f.get("type", "")).lower()
        for word in msg.split():
            if len(word) > 3 and word in tags_blob:
                tiebreak += 1
        # Require at least one content signal; otherwise skip
        if content > 0:
            scored.append((content + tiebreak, f))

    scored.sort(key=lambda x: -x[0])
    return [f for _, f in scored[:top_k]]


def format_facilities_context(facilities: list) -> str:
    """Serialize retrieved facilities as a markdown block for the system prompt."""
    if not facilities:
        return ""
    lines = [
        "\n\n## RETRIEVED NYC HEALTHCARE FACILITIES",
        "Use ONLY the facilities below when recommending specific places. "
        "Cite the exact name, address, and phone. Do not invent facilities.\n",
    ]
    for f in facilities:
        lines.append(
            f"- **{f['name']}** ({f.get('type', 'facility')})\n"
            f"  - Address: {f.get('address', 'N/A')}\n"
            f"  - Phone: {f.get('phone', 'N/A')}\n"
            f"  - Accepts: {', '.join(f.get('accepts', []))}\n"
            f"  - Languages: {', '.join(f.get('languages', []))}\n"
            f"  - Cost: {f.get('cost', 'N/A')}\n"
            f"  - Hours: {f.get('hours', 'N/A')}"
        )
    return "\n".join(lines)


# ── Facilities API endpoint ───────────────────────────────────────────────────
@app.get("/api/facilities")
async def get_facilities(type: Optional[str] = None, borough: Optional[str] = None):
    facilities = load_facilities()
    if type:
        facilities = [f for f in facilities if f.get("type") == type]
    if borough:
        facilities = [f for f in facilities
                      if f.get("borough", "").lower() == borough.lower()]
    return {"facilities": facilities}


@app.get("/api/facilities/search")
async def search_facilities(zipcode: str, insurance: Optional[str] = None):
    """Search facilities near a zipcode. insurance: 'none'|'medicaid'|'medicare'|any plan name."""
    all_f = load_facilities()

    # Load borough mapping
    try:
        with open(FACILITIES_FILE) as f:
            data = json.load(f)
        zip_map = data.get("zipcode_to_borough", {})
    except Exception:
        zip_map = {}

    zipcode = zipcode.strip()
    prefix3 = zipcode[:3]

    # Find borough from zipcode
    borough = zip_map.get(prefix3, "")

    # Also try exact match on facility zipcodes (nearest facilities)
    def zip_distance(fzip):
        try:
            return abs(int(fzip) - int(zipcode))
        except Exception:
            return 99999

    # Filter by borough first, then sort by zip distance
    if borough:
        same_borough = [f for f in all_f if f.get("borough", "") == borough]
    else:
        same_borough = all_f

    # Filter by insurance type
    if insurance == "none" or insurance == "uninsured":
        same_borough = [f for f in same_borough
                        if "uninsured" in f.get("accepts", []) or "nyc_care" in f.get("accepts", [])]
    elif insurance == "medicaid":
        same_borough = [f for f in same_borough if "medicaid" in f.get("accepts", [])]
    elif insurance == "medicare":
        same_borough = [f for f in same_borough if "medicare" in f.get("accepts", [])]
    elif insurance == "private":
        same_borough = [f for f in same_borough if "private_insurance" in f.get("accepts", [])]

    # Sort by zip proximity
    results = sorted(same_borough, key=lambda f: zip_distance(f.get("zipcode", "99999")))

    return {
        "zipcode": zipcode,
        "borough": borough or "NYC",
        "facilities": results[:6],
        "total": len(results)
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "healthy", "api_key_configured": bool(GEMINI_API_KEY)}

# ── Serve frontend static files (must be last) ────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
