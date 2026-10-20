"""Personal Health Assistant and Clinical Decision Support Orchestrator.

Provides intelligent conversational healthcare assistance, symptom triage,
emergency red-flag screening, regional outbreak surveillance, and government
welfare scheme navigation.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any

from app.services.assistant.safety_service import check_red_flags
from app.services.assistant.local_context_service import get_local_context
from app.services.assistant.disease_prediction_service import predict_diseases_and_tests
from app.services.assistant.symptom_service import structure_symptoms
from app.services.health_navigator import match_schemes

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the user's Personal Health Assistant — an intelligent, empathetic, and clinically rigorous public health guide.

YOUR ROLE & MISSION:
1. Provide accurate, helpful, and direct answers to whatever the user asks.
   - If the user greets you or makes casual conversation ("Hello", "How are you", "Namaste"), respond warmly and ask how you can help with their health today.
   - If the user asks general medical, health, or wellness questions ("How to prevent dengue?", "What is normal blood pressure?", "What is Ayushman Bharat?"), provide direct, well-structured, evidence-based answers.
   - If the user describes active symptoms or illnesses, provide empathetic clinical triage and guidance.

2. CRITICAL SAFETY & CLINICAL RULES:
   - You are a Personal Health Assistant. Never claim to replace an in-person consultation with a qualified doctor.
   - If any emergency red flag is present (chest pain, severe shortness of breath, heavy bleeding, loss of consciousness), advise calling 108 (Ambulance) or 112 (National Emergency) immediately.
   - Never declare a definitive diagnosis. Use phrases like "Possible conditions to discuss with your doctor include..." or "Your symptoms align with...".
   - Respond fluently in the language used by the user (English, Hindi, or Hinglish).
   - Keep answers well-structured, clear, and easy to read.
"""


def _tool_check_red_flags(symptoms_or_text: list[str] | str) -> dict[str, Any]:
    """Scan symptoms or free text for emergency red flags."""
    res = check_red_flags(symptoms_or_text)
    return {
        "urgent_emergency": res.urgent,
        "rule_id": res.rule_id,
        "emergency_message": res.message,
        "emergency_hotlines": {"ambulance": "108", "national_emergency": "112"},
    }


def _tool_get_district_context(state: str, district: str) -> dict[str, Any]:
    """Retrieve historical surveillance patterns from EpiClim for a state and district."""
    if not (state and district):
        return {"status": "skipped", "message": "Location not specified"}
    return get_local_context(state, district)


def _tool_predict_disease(
    symptoms: list[str],
    duration_days: int = 2,
    state: str | None = None,
    district: str | None = None,
    historical_context_items: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compute differential disease correlations and recommended tests."""
    return predict_diseases_and_tests(
        symptoms=symptoms,
        duration_days=duration_days,
        state=state,
        district=district,
        historical_context_items=historical_context_items,
    )


def _tool_match_schemes(
    state: str | None = None,
    age_group: str = "unknown",
    income_band: str = "unknown",
    occupation: str = "unknown",
) -> dict[str, Any]:
    """Match government healthcare schemes such as Ayushman Bharat."""
    answers = {
        "state": state or "",
        "age_group": age_group,
        "income_band": income_band,
        "occupation": occupation,
        "topics": ["all"],
    }
    return match_schemes(answers)


def _detect_language(text: str) -> str:
    """Detect if user query is in Hindi/Hinglish or English."""
    hindi_markers = (
        "hai", "ho", "raha", "rahi", "dard", "bukhar", "khansi", "ulti", "chakkar",
        "badan", "seene", "saans", "pet", "mein", "mera", "meri", "mujhe", "kya",
        "kaise", "batao", "ilaaj", "hospital", "doctor", "namaste", "namaskar",
        "theek", "shukriya", "dhanyawad", "aap", "tum"
    )
    tokens = set(re.findall(r"\w+", text.lower()))
    if any(m in tokens for m in hindi_markers):
        return "hindi"
    return "english"


def _classify_intent(message: str, detected_symptoms: list[str]) -> str:
    """Classifies user message into greeting, identity, knowledge Q&A, or symptom triage."""
    clean = message.lower().strip()
    tokens = set(re.findall(r"\w+", clean))

    # Greeting patterns
    greeting_phrases = [
        "hello", "hi", "hey", "namaste", "namaskar", "pranam", "good morning",
        "good afternoon", "good evening", "how are you", "kaise ho", "kya haal hai",
        "how do you do", "wassup", "sup", "how are u"
    ]
    if any(p in clean for p in greeting_phrases) and not detected_symptoms and len(tokens) <= 8:
        return "greeting"

    # Bot identity / capability questions
    identity_phrases = [
        "who are you", "what are you", "what can you do", "what is epidemai",
        "aap kaun ho", "tum kaun ho", "kya kar sakte ho", "help me",
        "how can you help", "what do you do", "tell me about yourself",
        "your name", "apna naam batao"
    ]
    if any(p in clean for p in identity_phrases) and not detected_symptoms:
        return "identity"

    # If actual physical symptoms are detected, triage is prioritized
    if detected_symptoms:
        return "symptom_triage"

    # Check for personal complaint language
    personal_complaint_markers = [
        "i have", "i am having", "suffering from", "feeling sick", "hurts", "pain in",
        "mujhe", "mera", "meri", "takleef", "dard ho raha"
    ]
    if any(m in clean for m in personal_complaint_markers):
        return "symptom_triage"

    # Otherwise treated as general knowledge / health Q&A
    return "knowledge_qna"


def _generate_knowledge_response(message: str, lang: str, state: str = "", district: str = "") -> str:
    """Generates an accurate, direct medical or public health answer for general questions."""
    clean = message.lower()

    # 1. Dengue Questions
    if "dengue" in clean or "dengu" in clean:
        if lang == "hindi":
            return (
                "🦟 **डेंगू (Dengue Fever) की जानकारी व रोकथाम:**\n\n"
                "• **संक्रमण का कारण:** यह एडीज (Aedes) मच्छर के काटने से फैलता है, जो सामान्यतः दिन के समय काटते हैं।\n"
                "• **मुख्य लक्षण:** अचानक तेज बुखार, आंखों के पीछे गंभीर दर्द (Retro-orbital pain), सिरदर्द, जोड़ों और मांसपेशियों में तेज दर्द, और शरीर पर लाल दाने।\n"
                "• **रोकथाम के मुख्य उपाय:**\n"
                "  1. अपने घर, कूलर, फूलदान और छतों पर कहीं भी पानी इकट्ठा न होने दें।\n"
                "  2. पूरी आस्तीन के कपड़े पहनें और मच्छर भगाने वाली क्रीम (DEET/Mosquito repellent) का प्रयोग करें।\n"
                "  3. सोते समय मच्छरदानी का उपयोग करें।\n"
                "• **जांच:** बुखार के पहले 1–5 दिनों में **Dengue NS1 Antigen** टेस्ट और प्लेटलेट काउंट (CBC) की निगरानी आवश्यक होती है।\n\n"
                "यदि आपको या परिवार में किसी को तेज बुखार है, तो तुरंत नजदीकी स्वास्थ्य केंद्र पर डॉक्टर से परामर्श लें।"
            )
        return (
            "🦟 **Dengue Fever: Prevention, Symptoms & Testing:**\n\n"
            "• **Transmission:** Caused by the Dengue virus transmitted by daytime-biting *Aedes* mosquitoes (especially *Aedes aegypti*).\n"
            "• **Cardinal Symptoms:** Sudden high-grade fever, severe pain behind the eyes (retro-orbital pain), intense joint/muscle aches ('breakbone fever'), skin rash, and nausea.\n"
            "• **Key Prevention Steps:**\n"
            "  1. **Eliminate Standing Water:** Regularly empty and scrub air coolers, flower pots, tires, and discarded containers.\n"
            "  2. **Personal Protection:** Wear full-sleeved, light-colored clothing and apply EPA-approved mosquito repellents (DEET, Picaridin).\n"
            "  3. **Household Screening:** Install mesh screens on windows and sleep under mosquito nets.\n"
            "• **Essential Diagnostics:**\n"
            "  - **Days 1–5:** Dengue NS1 Antigen ELISA / Rapid test.\n"
            "  - **Days 5+:** Dengue IgM/IgG Antibody test.\n"
            "  - **Monitoring:** Serial Complete Blood Count (CBC) to track platelet count and hematocrit.\n\n"
            "If you or someone around you is running a fever, stay well hydrated with ORS and consult a qualified physician."
        )

    # 2. Malaria Questions
    if "malaria" in clean:
        if lang == "hindi":
            return (
                "🦟 **मलेरिया (Malaria) की जानकारी व बचाव:**\n\n"
                "• **कारण:** यह मादा एनोफिलीज (Anopheles) मच्छर के काटने से फैलने वाला प्लाज्मोडियम परजीवी संक्रमण है। यह मच्छर अक्सर रात और शाम के समय काटते हैं।\n"
                "• **लक्षण:** कंपकंपी के साथ तेज बुखार, पसीना आना, तेज सिरदर्द, उल्टी और अत्यधिक कमजोरी।\n"
                "• **बचाव:** सोते समय मच्छरदानी का प्रयोग करें, खिड़कियों पर जाली लगाएं, और आसपास पानी जमा न होने दें।\n"
                "• **जांच:** मलेरिया रैपिड एंटीजन टेस्ट (RDT) या ब्लड स्मीयर माइक्रोस्कोपी (Peripheral Blood Smear) से तुरंत पुष्टि की जा सकती है।"
            )
        return (
            "🦟 **Malaria: Overview, Prevention & Testing:**\n\n"
            "• **Cause & Transmission:** Transmitted by infected female *Anopheles* mosquitoes carrying the *Plasmodium* parasite (predominantly *P. falciparum* and *P. vivax* in India).\n"
            "• **Classic Symptoms:** Paroxysms of shaking chills followed by high fever and profuse sweating, accompanied by fatigue, headache, and nausea.\n"
            "• **Prevention:** Use insecticide-treated bed nets, window screens, repellents, and eliminate standing water puddles.\n"
            "• **Diagnostic Tests:** Rapid Diagnostic Test (RDT for Pf/Pv antigens) and Peripheral Blood Smear Examination under microscopy."
        )

    # 3. Typhoid Questions
    if "typhoid" in clean or "enteric" in clean:
        if lang == "hindi":
            return (
                "💧 **टाइफाइड (Typhoid / Enteric Fever):**\n\n"
                "• **कारण:** यह साल्मोनेला टाइफी (Salmonella Typhi) बैक्टीरिया द्वारा दूषित पानी या अस्वच्छ भोजन से फैलता है।\n"
                "• **लक्षण:** सीढ़ीदार बढ़ता हुआ लगातार बुखार (Step-ladder fever), पेट में दर्द, सिरदर्द, भूख न लगना और अत्यधिक थकान।\n"
                "• **सावधानियां:** हमेशा उबला या सुरक्षित छना हुआ पानी पिएं, खुले में रखे कटे फल या बिना पके स्ट्रीट फूड से बचें, और खाना खाने से पहले हाथ साबुन से धोएं।\n"
                "• **जांच:** टाइफीडॉट (Typhidot IgM) या ब्लड कल्चर टेस्ट।"
            )
        return (
            "💧 **Typhoid Fever: Transmission, Symptoms & Care:**\n\n"
            "• **Transmission:** Bacterial infection caused by *Salmonella enterica* serotype Typhi, spread through food or drinking water contaminated with sewage.\n"
            "• **Clinical Signs:** Prolonged progressive step-ladder fever, abdominal pain, headache, coated tongue, loss of appetite, and extreme malaise.\n"
            "• **Prevention & Hygiene:** Drink only boiled or purified water, eat freshly cooked and covered hot food, wash hands thoroughly with soap, and peel raw fruits.\n"
            "• **Testing:** Typhidot IgM Rapid Test or Blood Culture & Sensitivity (gold standard)."
        )

    # 4. Ayushman Bharat PM-JAY / Healthcare Schemes
    if any(k in clean for k in ("ayushman", "pm-jay", "pmjay", "scheme", "yojana", "insurance", "card", "subsidy")):
        if lang == "hindi":
            return (
                "🏛️ **आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (AB PM-JAY):**\n\n"
                "• **कवरेज:** प्रत्येक पात्र परिवार को प्रति वर्ष द्वितीयक और तृतीयक अस्पताल में भर्ती के लिए **₹5,00,000** तक का मुफ्त व कैशलेस इलाज मिलता है।\n"
                "• **सुविधाएं:** देश भर के सभी संबद्ध सरकारी अस्पतालों और सूचीबद्ध निजी अस्पतालों में दवाएं, जांच और सर्जरी की सुविधा कैशलेस उपलब्ध है।\n"
                "• **पात्रता की जांच:** आप अपने आधार कार्ड या राशन कार्ड के साथ नजदीकी कॉमन सर्विस सेंटर (CSC) या सरकारी अस्पताल के आयुष्मान मित्र केंद्र पर जाकर पात्रता जांच सकते हैं।\n"
                "• **हेल्पलाइन:** अधिक जानकारी के लिए टोल-फ्री नंबर **14555** पर संपर्क करें।"
            )
        return (
            "🏛️ **Ayushman Bharat PM-JAY & Healthcare Subsidies:**\n\n"
            "• **Coverage Benefit:** Provides up to **₹5,00,000** per family per year for secondary and tertiary care hospitalization across India.\n"
            "• **Key Features:** Completely cashless and paperless treatment at all empanelled public and private healthcare facilities covering 1,900+ medical procedures.\n"
            "• **Eligibility Check:** You can verify eligibility using your Aadhaar card or Ration card at any empanelled hospital's *Ayushman Mitra* desk or Common Service Center (CSC).\n"
            "• **National Helpline:** Dial **14555** for instant beneficiary assistance."
        )

    # 5. ORS / Dehydration / Diarrhea Home Care
    if any(k in clean for k in ("ors", "electral", "dehydration", "loose motion", "hydration")):
        if lang == "hindi":
            return (
                "🥤 **ओआरएस (ORS) और निर्जलीकरण (Dehydration) प्रबंधन:**\n\n"
                "• **सही तरीका:** 1 पैकेट डब्ल्यूएचओ (WHO) प्रमाणित ओआरएस को 1 लीटर साफ उबले व ठंडे किए गए पानी में पूरी तरह घोलें।\n"
                "• **उपयोग:** दस्त या उल्टी होने पर हर बार 100–200 मिलीलीटर ओआरएस धीरे-धीरे पिएं। इसे 24 घंटे के अंदर समाप्त करें।\n"
                "• **क्या न लें:** अधिक मीठे पेय, कोल्ड ड्रिंक या कैफीन से बचें क्योंकि ये दस्त को बढ़ा सकते हैं।\n"
                "• **खतरे के संकेत:** यदि पेशाब कम हो रहा हो, होंठ व जीभ सूख रहे हों या अत्यधिक चक्कर आ रहे हों, तो तुरंत डॉक्टर से मिलें।"
            )
        return (
            "🥤 **Oral Rehydration Salts (ORS) & Hydration Guide:**\n\n"
            "• **Preparation:** Dissolve one full sachet of WHO-formula ORS into exactly **1 liter** of clean drinking water. Stir until completely clear.\n"
            "• **Administration:** Sip 100–200 ml gradually after each loose stool or bout of vomiting. Do not boil the prepared solution, and discard after 24 hours.\n"
            "• **Avoid:** Excessively sugary soft drinks or commercial juice, which can exacerbate osmotic diarrhea.\n"
            "• **Warning Signs:** Sunken eyes, extreme lethargy, absence of urination for >6 hours, or confusion require urgent IV fluid therapy at a clinic."
        )

    # 6. Normal Vitals / Blood Pressure / Platelet Count
    if any(k in clean for k in ("blood pressure", "bp", "platelet", "pulse", "vital", "normal range")):
        return (
            "📊 **Standard Adult Health Vital Ranges:**\n\n"
            "• **Blood Pressure:** Ideal is ~120/80 mmHg (Normal systolic 90–120 mmHg, diastolic 60–80 mmHg).\n"
            "• **Resting Heart Rate:** 60 to 100 beats per minute (bpm).\n"
            "• **Oxygen Saturation (SpO2):** 95% to 100% on room air.\n"
            "• **Normal Platelet Count:** 1.5 to 4.5 Lakh (150,000–450,000) per microliter of blood.\n"
            "• **Normal Body Temperature:** 97.8°F to 99.0°F (36.5°C to 37.2°C).\n\n"
            "*Always confirm any abnormal readings with repeat measurements and consult your healthcare provider.*"
        )

    # 7. General Healthcare Guidance Fallback
    if lang == "hindi":
        return (
            "नमस्ते! आपके पूछे गए विषय के संबंध में प्राथमिक स्वास्थ्य मार्गदर्शन:\n\n"
            "• **स्वस्थ दिनचर्या:** पर्याप्त पानी पिएं, पौष्टिक और संतुलित आहार लें, और नियमित शारीरिक गतिविधि करें।\n"
            "• **स्वच्छता व सुरक्षा:** मौसमी संक्रमणों से बचने के लिए हाथों की नियमित सफाई रखें और भोजन व पानी की शुद्धता सुनिश्चित करें।\n"
            "• **चिकित्सकीय सलाह:** यदि आपको कोई विशिष्ट शारीरिक परेशानी या लक्षण महसूस हो रहे हैं, तो मुझे विस्तार से बताएं ताकि मैं आपकी बेहतर सहायता कर सकूं।"
        )

    return (
        "Thank you for your question. Here is evidence-based healthcare guidance:\n\n"
        "• **General Wellness:** Maintain adequate daily hydration, a balanced nutritious diet, regular physical exercise, and 7–8 hours of restorative sleep.\n"
        "• **Preventative Hygiene:** Wash hands with soap before meals, ensure clean drinking water, and keep living spaces free of mosquito breeding sites.\n"
        "• **Personalized Assistance:** If you are experiencing any symptoms (such as fever, pain, fatigue, or cough), please feel free to describe them so I can provide personalized clinical triage."
    )


def _deterministic_agentic_flow(
    message: str,
    location: dict[str, str] | None = None,
    user_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Autonomous high-reliability clinical copilot with sub-millisecond local rule execution."""
    state = (location or {}).get("state", "").strip()
    district = (location or {}).get("district", "").strip()
    profile = user_profile or {}
    lang = _detect_language(message)

    # 1. Structure symptoms from user text
    structured = structure_symptoms(message)
    symptoms = [s.get("name", "") for s in structured.get("symptoms", []) if s.get("name")]
    duration_days = structured.get("duration_days") or 2

    # 2. Classify intent
    intent = _classify_intent(message, symptoms)

    # --- A. GREETING INTENT ---
    if intent == "greeting":
        if lang == "hindi":
            reply = (
                "नमस्ते! मैं आपका **पर्सनल हेल्थ असिस्टेंट (Personal Health Assistant)** हूँ।\n\n"
                "मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे:\n"
                "• अपने शारीरिक लक्षण बताकर स्वास्थ्य विश्लेषण व जांच की सलाह ले सकते हैं\n"
                "• सामान्य स्वास्थ्य, पोषण और मौसमी बीमारियों से बचाव के उपाय पूछ सकते हैं\n"
                "• **आयुष्मान भारत (PM-JAY)** जैसी सरकारी स्वास्थ्य योजनाओं की जानकारी प्राप्त कर सकते हैं\n\n"
                "आप आज कैसा महसूस कर रहे हैं?"
            )
        else:
            reply = (
                "Hello! I am doing well, thank you for asking. I am your **Personal Health Assistant**.\n\n"
                "How can I assist you today? You can:\n"
                "• Describe any symptoms you or your family are experiencing for clinical triage\n"
                "• Ask general medical, health, wellness, or prevention questions\n"
                "• Inquire about government healthcare subsidies and **Ayushman Bharat PM-JAY**\n\n"
                "How are you feeling today?"
            )
        return {
            "reply": reply,
            "agent_mode": "agentic_orchestrator",
            "engine": "Personal Health Assistant",
            "tools_executed": [],
            "triage_level": "GENERAL_INQUIRY",
            "red_flag_triggered": False,
            "emergency_action": None,
            "top_predictions": [],
            "recommended_tests": [],
            "local_context": None,
            "matched_schemes": [],
        }

    # --- B. IDENTITY / CAPABILITY INTENT ---
    if intent == "identity":
        if lang == "hindi":
            reply = (
                "मैं आपका **पर्सनल हेल्थ असिस्टेंट (Personal Health Assistant)** हूँ।\n\n"
                "मेरी मुख्य विशेषताएं:\n"
                "1. 🚨 **इमरजेंसी रेड-फ्लैग जांच:** गंभीर खतरे के लक्षणों को तुरंत पहचान कर 108/112 इमरजेंसी अलर्ट देना।\n"
                "2. 🗺️ **स्थानिक सर्विलांस:** आपके जिले (EpiClim डेटा) में फैलने वाली मौसमी बीमारियों के पैटर्न को देखना।\n"
                "3. 🔬 **लक्षण विश्लेषण व किफायती जांच:** संभावित बीमारियों का विश्लेषण कर लक्षित पैथोलॉजी जांचें सुझाना।\n"
                "4. 🏛️ **सरकारी योजनाएं:** आयुष्मान भारत (PM-JAY) और राज्य स्वास्थ्य योजनाओं की पात्रता बताना।\n\n"
                "*ध्यान दें: मैं चिकित्सकीय निर्णय सहायता प्रदान करता हूँ, अंतिम परामर्श डॉक्टर से ही लें।*"
            )
        else:
            reply = (
                "I am your **Personal Health Assistant** on EpidemAI.\n\n"
                "Here is what I can do for you:\n"
                "1. 🚨 **Emergency Red-Flag Screening:** Instantly detect urgent warning signs and provide 108/112 emergency routing.\n"
                "2. 🗺️ **Local Outbreak Context:** Cross-reference your district's historical epidemiological records (EpiClim).\n"
                "3. 🔬 **Symptom Differential & Targeted Tests:** Analyze reported symptoms and suggest specific, cost-saving laboratory tests instead of blanket panels.\n"
                "4. 🏛️ **Government Welfare Schemes:** Connect you with **Ayushman Bharat PM-JAY** and state healthcare programs.\n"
                "5. 💬 **General Medical Q&A:** Answer questions regarding disease prevention, vitals, nutrition, and first aid.\n\n"
                "*Please note: I provide clinical decision-support and health guidance, but do not replace an in-person physician consultation.*"
            )
        return {
            "reply": reply,
            "agent_mode": "agentic_orchestrator",
            "engine": "Personal Health Assistant",
            "tools_executed": [],
            "triage_level": "INFORMATIONAL",
            "red_flag_triggered": False,
            "emergency_action": None,
            "top_predictions": [],
            "recommended_tests": [],
            "local_context": None,
            "matched_schemes": [],
        }

    # --- C. KNOWLEDGE Q&A INTENT ---
    if intent == "knowledge_qna":
        reply = _generate_knowledge_response(message, lang, state, district)
        return {
            "reply": reply,
            "agent_mode": "agentic_orchestrator",
            "engine": "Personal Health Assistant",
            "tools_executed": [],
            "triage_level": "GENERAL_INQUIRY",
            "red_flag_triggered": False,
            "emergency_action": None,
            "top_predictions": [],
            "recommended_tests": [],
            "local_context": None,
            "matched_schemes": [],
        }

    # --- D. SYMPTOM TRIAGE INTENT ---
    tools_executed: list[str] = []

    # 1. Tool 1: Check Red Flags
    tools_executed.append("check_clinical_red_flags")
    red_flag_res = _tool_check_red_flags([message] + symptoms)

    # 2. Tool 2: District Outbreak Context
    local_ctx = None
    if state and district:
        tools_executed.append("get_district_outbreak_context")
        local_ctx = _tool_get_district_context(state, district)

    # 3. Tool 3: Disease Likelihood & Tests
    tools_executed.append("predict_disease_differential")
    hist_items = (local_ctx or {}).get("items", [])
    prediction_res = predict_diseases_and_tests(
        symptoms=symptoms,
        duration_days=duration_days,
        state=state or None,
        district=district or None,
        historical_context_items=hist_items,
    )

    # 4. Tool 4: Government Schemes
    tools_executed.append("match_government_healthcare_schemes")
    schemes_res = _tool_match_schemes(
        state=state,
        age_group=profile.get("age_group", "unknown"),
        income_band=profile.get("income_band", "under_3_lakh"),
        occupation=profile.get("occupation", "unorganised"),
    )

    # 5. Determine Triage Status
    if red_flag_res.get("urgent_emergency"):
        triage_level = "EMERGENCY"
    elif duration_days and duration_days >= 4:
        triage_level = "URGENT"
    elif symptoms:
        triage_level = "ROUTINE"
    else:
        triage_level = "SELF_CARE"

    # 6. Synthesize clinical response
    top_pred = prediction_res.get("predictions", [])[:2]
    top_dis_names = ", ".join([p.get("disease", "") or p.get("name", "") for p in top_pred]) or "seasonal viral infections"

    if lang == "hindi":
        if triage_level == "EMERGENCY":
            reply = (
                f"🚨 **आपातकालीन चेतावनी (Emergency Alert):**\n"
                f"आपके बताए गए लक्षणों में गंभीर खतरे के संकेत ({red_flag_res.get('emergency_message')}) पाए गए हैं।\n\n"
                f"**तुरंत कदम उठाएं:**\n"
                f"• बिना देर किए **108 (एम्बुलेंस)** या **112 (राष्ट्रीय आपातकाल)** पर कॉल करें।\n"
                f"• तुरंत नजदीकी आपातकालीन अस्पताल (Emergency Room) जाएं।"
            )
        else:
            loc_str = f" आपके जिले ({district}, {state})" if district else ""
            sym_str = ", ".join(symptoms) if symptoms else "दिए गए विवरण"
            reply = (
                f"नमस्ते। आपके बताए गए लक्षणों ({sym_str}) के विश्लेषण के आधार पर:\n\n"
                f"• **संभावित स्थितियां:** आपके लक्षण मुख्य रूप से **{top_dis_names}** के अनुकूल लग रहे हैं।\n"
                f"• **स्थानिक संदर्भ:**{loc_str} में बदलते मौसम के कारण इस तरह के संक्रमण देखे जाते हैं।\n"
                f"• **प्राथमिक देखभाल:** पर्याप्त मात्रा में ओआरएस (ORS) और तरल पदार्थ लें, हल्का सुपाच्य आहार लें और शरीर को आराम दें।\n"
                f"• **सलाह:** यदि बुखार 24–48 घंटे से अधिक बना रहे, तो डॉक्टर से मिलकर प्राथमिक जांच (जैसे सीबीसी / ब्लड टेस्ट) अवश्य करवाएं।\n"
                f"• **सरकारी सहायता:** आप आयुष्मान भारत (PM-JAY) के तहत संबद्ध सरकारी या निजी अस्पतालों में कैशलेस उपचार की सुविधा देख सकते हैं।"
            )
    else:
        if triage_level == "EMERGENCY":
            reply = (
                f"🚨 **EMERGENCY SAFETY ALERT:**\n"
                f"Your symptoms contain critical warning signs: **{red_flag_res.get('emergency_message')}**.\n\n"
                f"**Immediate Action Required:**\n"
                f"• Call **108 (Ambulance)** or **112 (National Emergency)** immediately.\n"
                f"• Proceed to the nearest hospital Emergency Department right away."
            )
        else:
            loc_str = f" in {district}, {state}" if district else ""
            sym_str = ", ".join(symptoms) if symptoms else "health notes"
            reply = (
                f"Based on clinical triage analysis of your reported symptoms ({sym_str}):\n\n"
                f"• **Differential Observations:** Highest correlation observed with **{top_dis_names}**.\n"
                f"• **Epidemiological Context:** Surveillance patterns{loc_str} indicate seasonal transmission for these conditions.\n"
                f"• **Clinical Urgency:** Triage level is **{triage_level}**. Schedule an in-person consultation if symptoms persist beyond 48 hours.\n"
                f"• **Supportive Care:** Maintain hydration with electrolytes (ORS), rest, and monitor body temperature.\n"
                f"• **Healthcare Entitlement:** You may be eligible for cashless secondary hospital care under **Ayushman Bharat PM-JAY**."
            )

    return {
        "reply": reply,
        "agent_mode": "agentic_orchestrator",
        "engine": "Personal Health Assistant",
        "tools_executed": tools_executed,
        "triage_level": triage_level,
        "red_flag_triggered": red_flag_res.get("urgent_emergency", False),
        "emergency_action": red_flag_res if red_flag_res.get("urgent_emergency") else None,
        "top_predictions": top_pred,
        "recommended_tests": prediction_res.get("recommended_tests", [])[:3],
        "local_context": {
            "state": state,
            "district": district,
            "matched_outbreak_items": (local_ctx or {}).get("items", []),
        } if local_ctx else None,
        "matched_schemes": (schemes_res.get("results", []) or [])[:3],
    }


async def process_agent_chat(
    message: str,
    conversation_history: list[dict[str, str]] | None = None,
    location: dict[str, str] | None = None,
    user_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Entry point for Personal Health Assistant chat with intelligent triage and LLM support."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    state = (location or {}).get("state", "").strip()
    district = (location or {}).get("district", "").strip()
    profile = user_profile or {}

    structured = structure_symptoms(message)
    symptoms = [s.get("name", "") for s in structured.get("symptoms", []) if s.get("name")]
    duration_days = structured.get("duration_days") or 2

    intent = _classify_intent(message, symptoms)

    # If no LLM key configured, use our autonomous high-accuracy deterministic assistant flow
    if not api_key:
        return _deterministic_agentic_flow(message, location, user_profile)

    # Pre-execute safety check
    red_flag_res = _tool_check_red_flags([message] + symptoms)

    # Local context check
    local_ctx = _tool_get_district_context(state, district) if state and district else None

    # Disease predictions only if symptoms were reported
    pred_res = (
        predict_diseases_and_tests(
            symptoms=symptoms,
            duration_days=duration_days,
            state=state or None,
            district=district or None,
            historical_context_items=(local_ctx or {}).get("items", []) if local_ctx else [],
        )
        if symptoms
        else {"predictions": [], "recommended_tests": []}
    )

    # Scheme match if symptoms or location provided
    schemes_res = _tool_match_schemes(
        state=state,
        age_group=profile.get("age_group", "unknown"),
        income_band=profile.get("income_band", "under_3_lakh"),
        occupation=profile.get("occupation", "unorganised"),
    )

    tools_executed: list[str] = []
    if intent == "symptom_triage":
        tools_executed.append("check_clinical_red_flags")
        if symptoms:
            tools_executed.append("predict_disease_differential")
        if local_ctx:
            tools_executed.append("get_district_outbreak_context")
        if schemes_res.get("results"):
            tools_executed.append("match_government_healthcare_schemes")

    triage_level = (
        "EMERGENCY"
        if red_flag_res.get("urgent_emergency")
        else ("URGENT" if duration_days >= 4 else "ROUTINE")
        if symptoms
        else ("INFORMATIONAL" if intent == "identity" else "GENERAL_INQUIRY")
    )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        context_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"CURRENT USER INTERACTION:\n"
            f"- User Message: \"{message}\"\n"
            f"- Detected Intent: {intent}\n"
            f"- Patient Location: State={state or 'Unknown'}, District={district or 'Unknown'}\n"
            f"- Structured Symptoms: {symptoms if symptoms else 'None reported'}\n"
            f"- Emergency Red Flag: {'TRIGGERED (CRITICAL)' if red_flag_res.get('urgent_emergency') else 'CLEAR'}\n"
            f"- Differential Correlations: {[p.get('disease') or p.get('name') for p in pred_res.get('predictions', [])[:3]] if symptoms else 'N/A'}\n"
            f"- Local Historical Outbreaks: {[i.get('disease') for i in (local_ctx or {}).get('items', [])]}\n"
            f"- Available Welfare Schemes: {[s.get('name') for s in schemes_res.get('results', [])[:2]]}\n\n"
            f"Instructions:\n"
            f"1. Directly answer what the user asked.\n"
            f"2. If it is a greeting or general inquiry, be conversational, helpful, and polite without diagnosing them.\n"
            f"3. If active symptoms are present, provide empathetic triage and advise whether to seek immediate medical care.\n"
            f"4. Never mention the word Gemini; identify yourself as the user's Personal Health Assistant."
        )

        response = await client.aio.models.generate_content(
            model=model_name,
            contents=context_prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=800,
            ),
        )

        reply_text = response.text or ""
        if not reply_text.strip():
            raise ValueError("Empty response from model")

        return {
            "reply": reply_text.strip(),
            "agent_mode": "agentic_orchestrator",
            "engine": "Personal Health Assistant",
            "tools_executed": tools_executed,
            "triage_level": triage_level,
            "red_flag_triggered": red_flag_res.get("urgent_emergency", False),
            "emergency_action": red_flag_res if red_flag_res.get("urgent_emergency") else None,
            "top_predictions": pred_res.get("predictions", [])[:3] if symptoms else [],
            "recommended_tests": pred_res.get("recommended_tests", [])[:3] if symptoms else [],
            "local_context": {
                "state": state,
                "district": district,
                "matched_outbreak_items": (local_ctx or {}).get("items", []),
            } if (local_ctx and symptoms) else None,
            "matched_schemes": (schemes_res.get("results", []) or [])[:3] if symptoms else [],
        }

    except Exception as exc:
        logger.warning("LLM API call unavailable (%s); using autonomous personal assistant flow", exc)
        return _deterministic_agentic_flow(message, location, user_profile)
