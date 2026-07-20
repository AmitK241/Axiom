from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from core.pipeline import (
    extract_assumptions, run_debate,
    generate_alternative_worlds, compute_blind_spot_score,
    run_full_pipeline
)
from memory.database import save_analysis, get_recent_analyses, get_analysis_by_id
import json, asyncio

router = APIRouter()

# NOTE: ThreadPoolExecutor has been intentionally removed.
# The pipeline is now fully async (asyncio-native), so run_in_executor() wrappers
# are no longer needed. The global asyncio.Semaphore in pipeline.py controls
# concurrency across all users and matrices without blocking the event loop.

class AnalyzeRequest(BaseModel):
    field: str
    matrix: str = "epistemic"

# ─── STREAMING ANALYSIS (main endpoint) ──────────────────────────
@router.post("/analyze/stream")
async def analyze_stream(request: AnalyzeRequest):
    field = request.field.strip()
    matrix = request.matrix.strip() or "epistemic"
    if not field:
        raise HTTPException(400, "Field cannot be empty")

    async def event_generator():
        try:
            # Step 1: Extract assumptions
            yield f"data: {json.dumps({'type': 'status', 'message': 'Extracting hidden assumptions...', 'step': 1, 'total_steps': 3})}\n\n"
            await asyncio.sleep(0.1)

            # Directly await — pipeline is now fully async, no executor needed
            assumptions = await extract_assumptions(field)

            yield f"data: {json.dumps({'type': 'assumptions_found', 'count': len(assumptions), 'assumptions': assumptions})}\n\n"

            # Step 2: Debate each assumption
            all_results = []   # local per-request list — no shared mutable state
            for i, assumption_obj in enumerate(assumptions):
                assumption_text = assumption_obj["assumption"]

                yield f"data: {json.dumps({'type': 'debating', 'assumption': assumption_text, 'index': i, 'total': len(assumptions)})}\n\n"

                debate = await run_debate(assumption_text, field, matrix)

                worlds = await generate_alternative_worlds(
                    assumption_text, field, debate.get("synthesis", {})
                )

                score = compute_blind_spot_score(assumption_obj, debate)

                result_item = {
                    "assumption": assumption_obj,
                    "debate": debate,
                    "alternative_worlds": worlds,
                    "blind_spot_score": score
                }
                all_results.append(result_item)

                yield f"data: {json.dumps({'type': 'assumption_done', 'index': i, 'result': result_item})}\n\n"

            # Step 3: Final summary
            overall_score = int(
                sum(r["blind_spot_score"]["score"] for r in all_results) /
                max(len(all_results), 1)
            )
            critical_count = sum(
                1 for r in all_results
                if r["blind_spot_score"]["risk_level"] in ["high", "catastrophic"]
            )

            final_result = {
                "field": field,
                "matrix": matrix,
                "overall_blind_spot_score": overall_score,
                "total_assumptions": len(all_results),
                "critical_count": critical_count,
                "results": all_results
            }

            # Save to MongoDB
            analysis_id = await save_analysis(field, final_result)
            final_result["analysis_id"] = analysis_id

            yield f"data: {json.dumps({'type': 'complete', 'result': final_result})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

# ─── NON-STREAMING (fallback) ────────────────────────────────────
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    field = request.field.strip()
    matrix = request.matrix.strip() or "epistemic"
    if not field:
        raise HTTPException(400, "Field cannot be empty")
    result = await run_full_pipeline(field, matrix)
    analysis_id = await save_analysis(field, result)
    result["analysis_id"] = analysis_id
    return result

# ─── HISTORY ────────────────────────────────────────────────────
@router.get("/history")
async def get_history():
    analyses = await get_recent_analyses(20)
    return {"analyses": analyses}

# ─── WATCHDOG RESCUE — latest saved result for a given field ─────
# Called by the frontend 30-second sliding watchdog when the SSE stream
# goes silent (Vercel timeout / Groq rate-limit stall). Returns the
# most-recently persisted full result doc so the UI can recover gracefully.
@router.get("/analysis/latest")
async def get_latest_analysis_for_field(
    field: str = Query(..., description="Exact field name to look up")
):
    from memory.database import db as _db
    if _db is None:
        raise HTTPException(503, "Database unavailable — no persisted result to rescue from")
    try:
        import re
        # Case-insensitive exact match, most-recent first
        pattern = re.compile(f"^{re.escape(field.strip())}$", re.IGNORECASE)
        doc = await _db.analyses.find_one(
            {"field": {"$regex": pattern}},
            sort=[("created_at", -1)]
        )
        if not doc:
            raise HTTPException(404, f"No saved analysis for field '{field}'")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Rescue fetch failed: {e}")


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    doc = await get_analysis_by_id(analysis_id)
    if not doc:
        raise HTTPException(404, "Analysis not found")
    return doc

# ─── DEMO EXAMPLES ──────────────────────────────────────────────
@router.get("/examples")
async def get_examples():
    return {
        "examples": [
            {
                "field": "AI Research",
                "description": "Assumptions powering modern AI development",
                "icon": "ti-brain"
            },
            {
                "field": "Cancer Treatment",
                "description": "Hidden beliefs in oncology",
                "icon": "ti-dna"
            },
            {
                "field": "Economic Policy",
                "description": "Assumptions behind modern economics",
                "icon": "ti-chart-line"
            },
            {
                "field": "Education System",
                "description": "What we believe about how humans learn",
                "icon": "ti-school"
            },
            {
                "field": "Mental Health Treatment",
                "description": "Core beliefs in psychiatry and therapy",
                "icon": "ti-heart-rate-monitor"
            }
        ]
    }
