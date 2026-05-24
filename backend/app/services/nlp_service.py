"""
Lightweight NLP entity extraction for disease surveillance text.
Uses keyword-based pattern matching for disease, location, and symptom detection.
"""

DISEASE_KEYWORDS = {
    "dengue": ["dengue", "dengue fever", "break-bone fever"],
    "malaria": ["malaria", "plasmodium", "mosquito-borne"],
    "flu": ["flu", "influenza", "h1n1", "seasonal flu"],
    "tb": ["tuberculosis", "tb", "mycobacterium"],
    "covid": ["covid", "coronavirus", "sars-cov", "covid-19"],
    "cholera": ["cholera", "vibrio"],
}

SYMPTOM_KEYWORDS = [
    "fever", "headache", "cough", "fatigue", "chills", "sweating",
    "joint pain", "rash", "nausea", "vomiting", "body ache",
    "weight loss", "difficulty breathing", "diarrhea",
]

CITY_NAMES = [
    "delhi", "mumbai", "lucknow", "jaipur", "kolkata", "guwahati",
    "hyderabad", "bangalore", "chennai", "patna", "pune", "ahmedabad",
    "nagpur", "surat", "bhopal", "kochi", "indore", "chandigarh",
    "ranchi", "visakhapatnam",
]

def extract_entities(text: str) -> dict:
    lower = text.lower()
    diseases = [d for d, keywords in DISEASE_KEYWORDS.items() if any(k in lower for k in keywords)]
    symptoms = [s for s in SYMPTOM_KEYWORDS if s in lower]
    locations = [c.title() for c in CITY_NAMES if c in lower]
    return {"diseases": diseases, "symptoms": symptoms, "locations": locations}
