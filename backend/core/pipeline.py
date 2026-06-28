from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from agents.four_agents import (
    run_historian, run_contrarian,
    run_scientist, run_philosopher, safe_json_parse
)
from dotenv import load_dotenv
import os, json, time

load_dotenv()

# ─── Groq model ──────────────────────────────────────────────────
GROQ_MODEL = "llama-3.1-8b-instant"   # free, ultra-fast, always-on

# ─── Persona Mappings ─────────────────────────────────────────────
PERSONA_MAP: dict[str, list[str]] = {
    "epistemic": ["Historian", "Contrarian", "Scientist", "Philosopher"],
    "venture":   ["The Investor", "The Corporate Critic", "The Target Customer", "The Growth Hacker"],
}
# Fallback to epistemic if an unknown key is supplied
DEFAULT_MATRIX = "epistemic"

def get_llm(temperature: float = 0.7, model_name: str | None = None,
            max_tokens: int = 2048) -> ChatGroq:
    """Build a ChatGroq client using llama-3.1-8b-instant.
    max_tokens can be overridden per-call to limit output and reduce TPM consumption.
    """
    model = model_name or os.getenv("GROQ_MODEL", GROQ_MODEL)
    return ChatGroq(
        model=model,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=max_tokens,
    )

# ─── Invocation wrapper with rate-limit retry ────────────────────
def invoke_with_fallback(agent_fn, assumption: str, field: str,
                         temperature: float = 0.7) -> dict:
    """Run agent_fn via Groq; on a 429 / rate-limit error wait briefly
    and retry once before returning a graceful error payload.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            llm = get_llm(temperature=temperature)
            return agent_fn(assumption, field, llm=llm)
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = (
                "429" in err_str
                or "rate_limit" in err_str.lower()
                or "rate limit" in err_str.lower()
                or "too many requests" in err_str.lower()
            )
            if is_rate_limit and attempt < max_retries - 1:
                wait = 15 * (attempt + 1)   # 15 s, 30 s, then give up
                print(f"[AXIOM] Rate limited - retrying in {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
                continue
            print(f"[AXIOM] Groq error: {exc}")
            return {
                "challenge": f"Groq unavailable: {str(exc)[:200]}",
                "risk_level": "medium",
            }

# ─── Generic dynamic-persona agent ───────────────────────────────
def run_dynamic_agent(persona_name: str, assumption: str, field: str,
                      temperature: float = 0.7) -> dict:
    """Invoke a dynamically-named persona agent.
    Builds a focused system prompt from the persona name and asks for
    the same structured JSON schema used by the four tuned epistemic agents.
    """
    system_prompt = (
        f"Act as {persona_name}. "
        f"Critically analyze the user's breakthrough topic from your strict professional persona perspective. "
        f"Be specific, sharp, and grounded in your role's expertise. "
        f"Output format: strict JSON only, no markdown, no preamble."
    )
    user_prompt = f"""Field: {field}
Assumption: "{assumption}"

Analyze this assumption from the perspective of {persona_name}.
Return JSON with these exact keys:
{{
    "perspective": "your key insight as {persona_name}",
    "weakest_point": "the most critical flaw you identify",
    "opportunity_or_risk": "what this means for your domain",
    "challenge": "one-sentence sharp challenge to this assumption from your perspective",
    "risk_level": "low|medium|high|catastrophic"
}}"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            llm = get_llm(temperature=temperature)
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ])
            return safe_json_parse(response.content)
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = (
                "429" in err_str
                or "rate_limit" in err_str.lower()
                or "too many requests" in err_str.lower()
            )
            if is_rate_limit and attempt < max_retries - 1:
                wait = 15 * (attempt + 1)
                print(f"[AXIOM] Rate limited ({persona_name}) - retrying in {wait}s")
                time.sleep(wait)
                continue
            print(f"[AXIOM] {persona_name} error: {exc}")
            return {
                "challenge": f"Agent unavailable: {str(exc)[:200]}",
                "risk_level": "medium",
            }

# ─── LAYER 1: Extract Assumptions ────────────────────────────────
def extract_assumptions(field: str) -> list[dict]:
    llm = get_llm(temperature=0.6, max_tokens=800)
    prompt = f"""You are a world-class epistemic analyst. Analyze the field/idea/policy: "{field}"

Extract EXACTLY 3 high-impact, core hidden assumptions that practitioners take completely for granted.
These must be beliefs so fundamental that questioning them seems absurd to insiders.

STRICT CONSTRAINT: Do NOT generate more than 3 assumptions under any circumstances.
Keep them deep, unique, and highly targeted — prioritise the 3 most dangerous blind spots only.

Return ONLY a valid JSON array of exactly 3 items, no markdown, no explanation:
[
  {{
    "assumption": "clear statement of the hidden assumption",
    "confidence": 85,
    "evidence_strength": "weak|medium|strong",
    "domain": "core|peripheral",
    "why_hidden": "one sentence: why nobody questions this"
  }}
]"""
    response = llm.invoke([HumanMessage(content=prompt)])
    text = response.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception:
        return [
            {
                "assumption": f"Core assumption of {field}",
                "confidence": 75,
                "evidence_strength": "medium",
                "domain": "core",
                "why_hidden": "Too fundamental to question"
            }
        ]

# ─── LAYER 2: Multi-Agent Debate ─────────────────────────────────
def run_debate(assumption: str, field: str, matrix: str = DEFAULT_MATRIX) -> dict:
    """Run a 4-agent debate.
    - matrix='epistemic' (default): uses the richly-tuned Historian/Contrarian/
      Scientist/Philosopher functions for maximum prompt quality.
    - Any other matrix (e.g. 'venture'): looks up PERSONA_MAP and runs each
      persona through the generic run_dynamic_agent() injector.
    """
    selected_agents = PERSONA_MAP.get(matrix, PERSONA_MAP[DEFAULT_MATRIX])

    # ── Epistemic path: use the four tuned specialist functions ──────
    if matrix == "epistemic":
        agent_fns = [
            ("historian",   run_historian,   0.6),
            ("contrarian",  run_contrarian,  0.9),
            ("scientist",   run_scientist,   0.4),
            ("philosopher", run_philosopher, 0.7),
        ]
        results = {}
        for i, (name, fn, temp) in enumerate(agent_fns):
            print(f"[AXIOM] Running {name} agent ({matrix})...")
            results[name] = invoke_with_fallback(fn, assumption, field, temperature=temp)
            if i < len(agent_fns) - 1:
                time.sleep(8)   # 8 s inter-agent delay — stays under free-tier TPM

    # ── Dynamic path: inject persona names via run_dynamic_agent() ──
    else:
        temperatures = [0.6, 0.9, 0.4, 0.7]  # mirror the epistemic defaults
        results = {}
        for i, persona_name in enumerate(selected_agents):
            result_key = persona_name.lower().replace(" ", "_").replace("the_", "")
            print(f"[AXIOM] Running '{persona_name}' agent ({matrix})...")
            results[result_key] = run_dynamic_agent(
                persona_name, assumption, field,
                temperature=temperatures[i]
            )
            if i < len(selected_agents) - 1:
                time.sleep(8)   # 8 s inter-agent delay — stays under free-tier TPM

    # ── Synthesis (shared across both paths) ─────────────────────────
    agent_labels = [
        f"{name}: {json.dumps(result)}"
        for name, result in results.items()
        if name != "synthesis"
    ]
    llm = get_llm(temperature=0.5)
    synthesis_prompt = f"""Four expert agents ({', '.join(selected_agents)}) debated this assumption: "{assumption}"
Field: {field}

{chr(10).join(agent_labels)}

Synthesize their perspectives into a final verdict.
Return ONLY valid JSON, no markdown:
{{
    "blind_spot_score": 75,
    "consensus_risk": "low|medium|high|catastrophic",
    "strongest_challenge": "the most devastating argument against this assumption",
    "recommended_experiments": ["experiment 1", "experiment 2"],
    "one_line_verdict": "sharp one-sentence summary of why this assumption is dangerous"
}}"""

    response = llm.invoke([HumanMessage(content=synthesis_prompt)])
    synthesis = safe_json_parse(response.content)
    results["synthesis"] = synthesis
    return results

# ─── LAYER 3: Alternative World Generator ─────────────────────────
def generate_alternative_worlds(
    assumption: str,
    field: str,
    synthesis: dict
) -> list[dict]:
    llm = get_llm(temperature=0.85)
    prompt = f"""Field: {field}
Assumption that might be FUNDAMENTALLY WRONG: "{assumption}"
Strongest evidence it's wrong: {synthesis.get('strongest_challenge', 'multiple angles')}

Generate 3 "Alternative Worlds" — what would reality look like if this assumption is false?
Each world should be specific, imaginative, and grounded.

Return ONLY valid JSON array, no markdown:
[
  {{
    "world_name": "catchy 3-word name",
    "tagline": "one provocative sentence",
    "description": "2-3 sentences describing this alternative reality",
    "research_directions": ["direction 1", "direction 2"],
    "startup_opportunity": "one specific business idea this unlocks",
    "probability": 25
  }}
]"""
    response = llm.invoke([HumanMessage(content=prompt)])
    text = response.content.strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception:
        return []

# ─── LAYER 4: Blind Spot Score ────────────────────────────────────
def compute_blind_spot_score(
    assumption: dict,
    debate_result: dict
) -> dict:
    synthesis = debate_result.get("synthesis", {})

    raw_score = synthesis.get("blind_spot_score", 50)
    confidence = assumption.get("confidence", 75)
    evidence = assumption.get("evidence_strength", "medium")

    evidence_multiplier = {"weak": 1.2, "medium": 1.0, "strong": 0.8}
    adjusted = min(100, int(raw_score * evidence_multiplier.get(evidence, 1.0)))

    risk = synthesis.get("consensus_risk", "medium")
    risk_map = {"low": "🟢", "medium": "🟡", "high": "🔴", "catastrophic": "💀"}

    return {
        "score": adjusted,
        "risk_level": risk,
        "risk_emoji": risk_map.get(risk, "🟡"),
        "confidence": confidence,
        "evidence_strength": evidence,
        "verdict": synthesis.get("one_line_verdict", "Needs investigation")
    }

# ─── FULL PIPELINE ────────────────────────────────────────────────
def run_full_pipeline(field: str, matrix: str = DEFAULT_MATRIX) -> dict:
    assumptions = extract_assumptions(field)
    full_results = []

    for assumption_obj in assumptions:
        assumption_text = assumption_obj["assumption"]
        debate = run_debate(assumption_text, field, matrix=matrix)
        worlds = generate_alternative_worlds(
            assumption_text, field, debate.get("synthesis", {})
        )
        score = compute_blind_spot_score(assumption_obj, debate)

        full_results.append({
            "assumption": assumption_obj,
            "debate": debate,
            "alternative_worlds": worlds,
            "blind_spot_score": score
        })

    overall_score = int(
        sum(r["blind_spot_score"]["score"] for r in full_results) /
        max(len(full_results), 1)
    )

    return {
        "field": field,
        "matrix": matrix,
        "overall_blind_spot_score": overall_score,
        "total_assumptions": len(full_results),
        "critical_count": sum(
            1 for r in full_results
            if r["blind_spot_score"]["risk_level"] in ["high", "catastrophic"]
        ),
        "results": full_results
    }
