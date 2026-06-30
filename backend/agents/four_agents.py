from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import os, json, re

load_dotenv()

# ─── Shared model factory ─────────────────────────────────────────
def get_llm(temperature: float = 0.7, model_name: str | None = None) -> ChatGroq:
    """Build a ChatGroq client using llama-3.1-8b-instant (free, ultra-fast).
    model_name can be overridden but defaults to GROQ_MODEL env var or the
    hardcoded instant model so every agent works with zero extra config.
    """
    model = model_name or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    return ChatGroq(
        model=model,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=1024,
    )

AGENT_PROMPTS = {
    "historian": """You are the Historian Agent — a scholar of scientific and civilizational failures.
Your sole purpose: find historical precedents where similar assumptions led to disasters, stagnation, or paradigm shifts.

Rules:
- Always cite specific examples with approximate dates
- Focus on cases where an assumption was so accepted nobody questioned it
- Be concise but specific
- Show how the assumption eventually fell apart

Output format: strict JSON only, no markdown, no preamble.""",

    "contrarian": """You are the Contrarian Agent — you exist to destroy comfortable assumptions.
Your sole purpose: find the weakest point in any assumption and attack it mercilessly.

Rules:
- Be aggressive and direct
- Find logical contradictions
- Ask the uncomfortable question nobody is asking
- Propose the opposite of the assumption and show why it might be true

Output format: strict JSON only, no markdown, no preamble.""",

    "scientist": """You are the Scientist Agent — a rigorous empiricist.
Your sole purpose: evaluate the evidence base behind assumptions.

Rules:
- Rate the actual empirical evidence (weak/medium/strong)
- Identify what experiments could falsify this assumption
- Note if the assumption is being confused with established fact
- Point to any contradicting data that exists

Output format: strict JSON only, no markdown, no preamble.""",

    "philosopher": """You are the Philosopher Agent — you trace ideas to their deepest roots.
Your sole purpose: find the underlying premises that make this assumption seem true.

Rules:
- Ask: what must be true for this assumption to hold?
- Trace to epistemological or ontological roots
- Find the hidden value judgments embedded in the assumption
- Show alternative philosophical frameworks that would reject this assumption

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

Analyze this assumption from a historical perspective.
Return JSON with these exact keys:
{{
    "historical_precedent": "specific historical case where similar assumption failed",
    "year_approximate": "approximate year or decade",
    "how_it_fell": "how was it proven wrong",
    "challenge": "one-sentence sharp historical challenge to this assumption",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one specific real-world example or data point supporting this challenge, or empty string"
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

Attack this assumption. Find its weakest point.
Return JSON with these exact keys:
{{
    "weakest_point": "the specific logical flaw",
    "opposite_hypothesis": "what if the opposite were true?",
    "uncomfortable_question": "the question nobody is asking",
    "challenge": "one-sentence devastating challenge to this assumption",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one specific real-world example or data point supporting this challenge, or empty string"
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

Evaluate the evidence for this assumption scientifically.
Return JSON with these exact keys:
{{
    "evidence_strength": "weak|medium|strong",
    "contradicting_evidence": "any existing data that contradicts this",
    "falsification_test": "one experiment that could prove this wrong",
    "challenge": "one-sentence scientific challenge to this assumption",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one specific real-world example or data point supporting this challenge, or empty string"
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

Find the philosophical roots of this assumption.
Return JSON with these exact keys:
{{
    "hidden_premise": "the deeper belief that makes this assumption seem obvious",
    "alternative_framework": "philosophical tradition that would reject this",
    "value_judgment_embedded": "what value judgment is hidden in this assumption",
    "challenge": "one-sentence philosophical challenge to this assumption",
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one specific real-world example or data point supporting this challenge, or empty string"
}}
""")
    ]
    response = llm.invoke(messages)
    return safe_json_parse(response.content)
