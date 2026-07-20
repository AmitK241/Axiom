from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from agents.four_agents import (
    run_historian, run_contrarian,
    run_scientist, run_philosopher, safe_json_parse
)
from dotenv import load_dotenv
import os, json, asyncio

load_dotenv()

# ─── Groq model ───────────────────────────────────────────────────
GROQ_MODEL = "llama-3.1-8b-instant"   # free, ultra-fast, always-on

# ─── Global concurrency limiter ───────────────────────────────────
# Controls the maximum number of simultaneous Groq API calls across ALL
# concurrent users and ALL matrices (epistemic + venture).
# Tune via GROQ_MAX_CONCURRENT env var (default 2 → safe under 30 RPM
# free-tier assuming ~2s per call).
GROQ_MAX_CONCURRENT: int = int(os.getenv("GROQ_MAX_CONCURRENT", "2"))
_groq_semaphore: asyncio.Semaphore | None = None   # lazily initialised


def _get_semaphore() -> asyncio.Semaphore:
    """Return the module-level semaphore, creating it on the first call.

    We use lazy initialisation so the semaphore is always created on the
    running event-loop (important for uvicorn/FastAPI reload scenarios).
    """
    global _groq_semaphore
    if _groq_semaphore is None:
        _groq_semaphore = asyncio.Semaphore(GROQ_MAX_CONCURRENT)
    return _groq_semaphore


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


# ─── Low-level async Groq invoker ────────────────────────────────
async def _invoke_llm(llm: ChatGroq, messages: list) -> any:
    """Acquire the global semaphore, make ONE Groq call, then release.

    Runs the synchronous llm.invoke() in the default executor so it
    doesn't block the event loop while the semaphore slot is held.
    Exponential backoff on 429 / rate-limit errors only (2s → 4s → 8s,
    max 3 attempts). Generic errors propagate immediately.
    """
    semaphore = _get_semaphore()
    max_retries = 3
    backoff_seconds = [2, 4, 8]

    for attempt in range(max_retries):
        async with semaphore:
            print(f"[AXIOM] Semaphore acquired (slot {attempt + 1}/{max_retries})")
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, llm.invoke, messages)
                return response
            except Exception as exc:
                err_str = str(exc)
                is_rate_limit = (
                    "429" in err_str
                    or "rate_limit" in err_str.lower()
                    or "rate limit" in err_str.lower()
                    or "too many requests" in err_str.lower()
                )
                if is_rate_limit and attempt < max_retries - 1:
                    wait = backoff_seconds[attempt]   # 2s, 4s, then give up
                    print(
                        f"[AXIOM] Rate limited — exponential backoff {wait}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    # Release semaphore BEFORE sleeping so other callers can proceed
                    await asyncio.sleep(wait)
                    continue
                # Non-rate-limit error or final attempt — re-raise immediately
                raise


# ─── Invocation wrapper with rate-limit retry ─────────────────────
async def invoke_with_fallback(agent_fn, assumption: str, field: str,
                               temperature: float = 0.7) -> dict:
    """Run a synchronous agent_fn via the shared async Groq invoker.

    The agent functions (run_historian, etc.) still build their own llm
    instance and message list internally.  We wrap their llm.invoke() call
    through _invoke_llm so the semaphore controls concurrency globally.
    """
    try:
        # Build the llm and messages the same way the agent does internally,
        # then call _invoke_llm so concurrency is controlled.
        # Because the agent functions are synchronous and call llm.invoke()
        # themselves, we run them in the executor — the semaphore wraps the
        # actual network call via _invoke_llm called from inside the executor.
        # Simpler: just call the agent inside the semaphore-guarded executor.
        semaphore = _get_semaphore()
        max_retries = 3
        backoff_seconds = [2, 4, 8]
        llm = get_llm(temperature=temperature)

        for attempt in range(max_retries):
            async with semaphore:
                try:
                    loop = asyncio.get_event_loop()
                    result = await loop.run_in_executor(
                        None, agent_fn, assumption, field, llm
                    )
                    return result
                except Exception as exc:
                    err_str = str(exc)
                    is_rate_limit = (
                        "429" in err_str
                        or "rate_limit" in err_str.lower()
                        or "rate limit" in err_str.lower()
                        or "too many requests" in err_str.lower()
                    )
                    if is_rate_limit and attempt < max_retries - 1:
                        wait = backoff_seconds[attempt]
                        print(
                            f"[AXIOM] Rate limited — exponential backoff {wait}s "
                            f"(attempt {attempt + 1}/{max_retries})"
                        )
                        await asyncio.sleep(wait)
                        continue
                    print(f"[AXIOM] Groq error: {exc}")
                    return {
                        "challenge": f"Groq unavailable: {str(exc)[:200]}",
                        "risk_level": "medium",
                    }
    except Exception as exc:
        print(f"[AXIOM] invoke_with_fallback outer error: {exc}")
        return {
            "challenge": f"Groq unavailable: {str(exc)[:200]}",
            "risk_level": "medium",
        }


# ─── Generic dynamic-persona agent ───────────────────────────────
async def run_dynamic_agent(persona_name: str, assumption: str, field: str,
                            temperature: float = 0.7) -> dict:
    """Invoke a dynamically-named persona agent through the global semaphore.

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
    "risk_level": "low|medium|high|catastrophic",
    "evidence_ref": "one specific real-world example or data point supporting this challenge, or empty string"
}}"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    semaphore = _get_semaphore()
    max_retries = 3
    backoff_seconds = [2, 4, 8]

    for attempt in range(max_retries):
        async with semaphore:
            try:
                llm = get_llm(temperature=temperature)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, llm.invoke, messages)
                return safe_json_parse(response.content)
            except Exception as exc:
                err_str = str(exc)
                is_rate_limit = (
                    "429" in err_str
                    or "rate_limit" in err_str.lower()
                    or "too many requests" in err_str.lower()
                )
                if is_rate_limit and attempt < max_retries - 1:
                    wait = backoff_seconds[attempt]
                    print(
                        f"[AXIOM] Rate limited ({persona_name}) — exponential backoff {wait}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait)
                    continue
                print(f"[AXIOM] {persona_name} error: {exc}")
                return {
                    "challenge": f"Agent unavailable: {str(exc)[:200]}",
                    "risk_level": "medium",
                }

    # Should never reach here, but guard anyway
    return {"challenge": "Max retries exhausted", "risk_level": "medium"}


# ─── LAYER 1: Extract Assumptions ────────────────────────────────
async def extract_assumptions(field: str) -> list[dict]:
    """Extract 3 hidden assumptions from the given field via Groq."""
    semaphore = _get_semaphore()
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

    messages = [HumanMessage(content=prompt)]
    max_retries = 3
    backoff_seconds = [2, 4, 8]

    for attempt in range(max_retries):
        async with semaphore:
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, llm.invoke, messages)
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
            except Exception as exc:
                err_str = str(exc)
                is_rate_limit = (
                    "429" in err_str
                    or "rate_limit" in err_str.lower()
                    or "too many requests" in err_str.lower()
                )
                if is_rate_limit and attempt < max_retries - 1:
                    wait = backoff_seconds[attempt]
                    print(f"[AXIOM] Rate limited (extract_assumptions) — backoff {wait}s")
                    await asyncio.sleep(wait)
                    continue
                raise

    return []


# ─── LAYER 2: Multi-Agent Debate ─────────────────────────────────
async def run_debate(assumption: str, field: str, matrix: str = DEFAULT_MATRIX) -> dict:
    """Run a 4-agent debate — fully async, semaphore-governed.

    - matrix='epistemic': uses the richly-tuned Historian/Contrarian/
      Scientist/Philosopher functions.
    - Any other matrix (e.g. 'venture'): looks up PERSONA_MAP and runs each
      persona through the generic run_dynamic_agent() injector.

    Inter-agent delays have been REMOVED. The global semaphore controls
    burst rate instead, preventing 429 errors without hard-coded sleeps.
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
        for name, fn, temp in agent_fns:
            print(f"[AXIOM] Running {name} agent ({matrix})...")
            results[name] = await invoke_with_fallback(fn, assumption, field, temperature=temp)

    # ── Dynamic path: inject persona names via run_dynamic_agent() ──
    else:
        temperatures = [0.6, 0.9, 0.4, 0.7]   # mirror the epistemic defaults
        results = {}
        for i, persona_name in enumerate(selected_agents):
            result_key = persona_name.lower().replace(" ", "_").replace("the_", "")
            print(f"[AXIOM] Running '{persona_name}' agent ({matrix})...")
            results[result_key] = await run_dynamic_agent(
                persona_name, assumption, field,
                temperature=temperatures[i]
            )

    # ── Synthesis (shared across both paths) ─────────────────────────
    agent_labels = [
        f"{name}: {json.dumps(result)}"
        for name, result in results.items()
        if name != "synthesis"
    ]

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

    semaphore = _get_semaphore()
    max_retries = 3
    backoff_seconds = [2, 4, 8]

    for attempt in range(max_retries):
        async with semaphore:
            try:
                llm = get_llm(temperature=0.5)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None, llm.invoke, [HumanMessage(content=synthesis_prompt)]
                )
                synthesis = safe_json_parse(response.content)
                results["synthesis"] = synthesis
                return results
            except Exception as exc:
                err_str = str(exc)
                is_rate_limit = (
                    "429" in err_str
                    or "rate_limit" in err_str.lower()
                    or "too many requests" in err_str.lower()
                )
                if is_rate_limit and attempt < max_retries - 1:
                    wait = backoff_seconds[attempt]
                    print(f"[AXIOM] Rate limited (synthesis) — backoff {wait}s")
                    await asyncio.sleep(wait)
                    continue
                print(f"[AXIOM] Synthesis error: {exc}")
                results["synthesis"] = {}
                return results

    results["synthesis"] = {}
    return results


# ─── LAYER 3: Alternative World Generator ────────────────────────
async def generate_alternative_worlds(
    assumption: str,
    field: str,
    synthesis: dict
) -> list[dict]:
    """Generate 3 alternative-world scenarios through the global semaphore."""
    semaphore = _get_semaphore()
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

    max_retries = 3
    backoff_seconds = [2, 4, 8]

    for attempt in range(max_retries):
        async with semaphore:
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None, llm.invoke, [HumanMessage(content=prompt)]
                )
                text = response.content.strip().replace("```json", "").replace("```", "").strip()
                try:
                    data = json.loads(text)
                    return data if isinstance(data, list) else []
                except Exception:
                    return []
            except Exception as exc:
                err_str = str(exc)
                is_rate_limit = (
                    "429" in err_str
                    or "rate_limit" in err_str.lower()
                    or "too many requests" in err_str.lower()
                )
                if is_rate_limit and attempt < max_retries - 1:
                    wait = backoff_seconds[attempt]
                    print(f"[AXIOM] Rate limited (alt-worlds) — backoff {wait}s")
                    await asyncio.sleep(wait)
                    continue
                return []

    return []


# ─── LAYER 4: Blind Spot Score ────────────────────────────────────
def compute_blind_spot_score(
    assumption: dict,
    debate_result: dict
) -> dict:
    """Pure computation — no Groq call needed, remains synchronous."""
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
async def run_full_pipeline(field: str, matrix: str = DEFAULT_MATRIX) -> dict:
    """End-to-end async pipeline — safe to await directly from a FastAPI route."""
    assumptions = await extract_assumptions(field)
    full_results = []

    for assumption_obj in assumptions:
        assumption_text = assumption_obj["assumption"]
        debate = await run_debate(assumption_text, field, matrix=matrix)
        worlds = await generate_alternative_worlds(
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
