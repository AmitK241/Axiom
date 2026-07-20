from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import os, json, re

load_dotenv()

# ─── Shared model factory ─────────────────────────────────────────
def get_llm(temperature: float = 0.7, model_name: str | None = None) -> ChatGroq:
    """Build a ChatGroq client using llama-3.1-8b-instant (free, ultra-fast).
    max_tokens=400: covers any structured 6-field JSON response with a 65%
    buffer (6 fields × ~40 tokens = ~240 tokens used). Keeps per-call TPM
    consumption predictable without ever truncating a complete JSON object.
    """
    model = model_name or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    return ChatGroq(
        model=model,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=400,
    )

AGENT_PROMPTS = {
    "historian": """You are the Historian Agent — a scholar of scientific and civilizational failures.
Your sole purpose: find historical precedents where similar assumptions led to disasters, stagnation, or paradigm shifts.

Rules:
- Always cite specific examples with approximate dates
- Focus on cases where an assumption was so accepted nobody questioned it
- Be precise and avoid repetition — one sharp example beats three vague ones
- Show how the assumption eventually fell apart

Output format: strict JSON only, no markdown, no preamble.""",

    "contrarian": """You are the Contrarian Agent — you exist to destroy comfortable assumptions.
Your sole purpose: find the weakest point in any assumption and attack it mercilessly.

Rules:
- Be aggressive and direct
- Find logical contradictions
- Ask the uncomfortable question nobody is asking
- Be precise and avoid repetition — one devastating argument beats vague criticism

Output format: strict JSON only, no markdown, no preamble.""",

    "scientist": """You are the Scientist Agent — a rigorous empiricist.
Your sole purpose: evaluate the evidence base behind assumptions.

Rules:
- Rate the actual empirical evidence (weak/medium/strong)
- Identify one experiment that could falsify this assumption
- Note if the assumption is confused with established fact
- Be precise and avoid repetition — cite one specific contradicting data point

Output format: strict JSON only, no markdown, no preamble.""",

    "philosopher": """You are the Philosopher Agent — you trace ideas to their deepest roots.
Your sole purpose: find the underlying premises that make this assumption seem true.

Rules:
- Ask: what must be true for this assumption to hold?
- Trace to epistemological or ontological roots
- Find the hidden value judgments embedded in the assumption
- Be precise and avoid repetition — name one specific philosophical tradition that rejects it

Output format: strict JSON only, no markdown, no preamble."""
}

def safe_json_parse(text: str) -> dict:
    text = text.strip()
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    try:
        return json.loads(text)
    except Exception:
        return {
            "challenge": text[:300],
            "evidence": "Parse error — raw response captured",
            "historical_precedent": "N/A",
            "risk_level": "medium"
        }

def run_historian(assumption: str, field: str, llm=None) -> dict:
    llm = llm or get_llm(temperature=0.6)
    messages = [
        SystemMessage(content=AGENT_PROMPTS["historian"]),
        HumanMessage(content=f"""
Field: {field}
Assumption: "{assumption}"

Return JSON (values: 1-2 sentences max):
{{
    "historical_precedent": "specific historical case where similar assumption failed",
    "year_approximate": "approximate year or decade",
    "how_it_fell": "how was it proven wrong",
    "challenge": "one sharp historical challenge to this assumption",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one real-world data point, or empty string"
}}
""")
    ]
    response = llm.invoke(messages)
    return safe_json_parse(response.content)

def run_contrarian(assumption: str, field: str, llm=None) -> dict:
    llm = llm or get_llm(temperature=0.9)
    messages = [
        SystemMessage(content=AGENT_PROMPTS["contrarian"]),
        HumanMessage(content=f"""
Field: {field}
Assumption: "{assumption}"

Return JSON (values: 1-2 sentences max):
{{
    "weakest_point": "the specific logical flaw",
    "opposite_hypothesis": "what if the opposite were true",
    "uncomfortable_question": "the question nobody is asking",
    "challenge": "one devastating challenge sentence",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one real-world data point, or empty string"
}}
""")
    ]
    response = llm.invoke(messages)
    return safe_json_parse(response.content)

def run_scientist(assumption: str, field: str, llm=None) -> dict:
    llm = llm or get_llm(temperature=0.4)
    messages = [
        SystemMessage(content=AGENT_PROMPTS["scientist"]),
        HumanMessage(content=f"""
Field: {field}
Assumption: "{assumption}"

Return JSON (values: 1-2 sentences max):
{{
    "evidence_strength": "weak|medium|strong",
    "contradicting_evidence": "one specific data point that contradicts this",
    "falsification_test": "one experiment that could prove this wrong",
    "challenge": "one scientific challenge sentence",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one real-world data point, or empty string"
}}
""")
    ]
    response = llm.invoke(messages)
    return safe_json_parse(response.content)

def run_philosopher(assumption: str, field: str, llm=None) -> dict:
    llm = llm or get_llm(temperature=0.7)
    messages = [
        SystemMessage(content=AGENT_PROMPTS["philosopher"]),
        HumanMessage(content=f"""
Field: {field}
Assumption: "{assumption}"

Return JSON (values: 1-2 sentences max):
{{
    "hidden_premise": "the deeper belief that makes this assumption seem obvious",
    "alternative_framework": "philosophical tradition that rejects this",
    "value_judgment_embedded": "the hidden value judgment in this assumption",
    "challenge": "one philosophical challenge sentence",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one real-world data point, or empty string"
}}
""")
    ]
    response = llm.invoke(messages)
    return safe_json_parse(response.content)
