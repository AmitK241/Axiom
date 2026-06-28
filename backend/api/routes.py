from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from core.pipeline import (
    extract_assumptions, run_debate,
    generate_alternative_worlds, compute_blind_spot_score,
    run_full_pipeline
)
from memory.database import save_analysis, get_recent_analyses, get_analysis_by_id
import json, asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=4)

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

            loop = asyncio.get_event_loop()
            assumptions = await loop.run_in_executor(
                executor, extract_assumptions, field
            )

            yield f"data: {json.dumps({'type': 'assumptions_found', 'count': len(assumptions), 'assumptions': assumptions})}\n\n"

            # Step 2: Debate each assumption
            all_results = []
            for i, assumption_obj in enumerate(assumptions):
                assumption_text = assumption_obj["assumption"]

                yield f"data: {json.dumps({'type': 'debating', 'assumption': assumption_text, 'index': i, 'total': len(assumptions)})}\n\n"

                debate = await loop.run_in_executor(
                        executor, run_debate, assumption_text, field, matrix
                    )

                worlds = await loop.run_in_executor(
                    executor, generate_alternative_worlds,
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
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, run_full_pipeline, field, matrix)
    analysis_id = await save_analysis(field, result)
    result["analysis_id"] = analysis_id
    return result

# ─── HISTORY ────────────────────────────────────────────────────
@router.get("/history")
async def get_history():
    analyses = await get_recent_analyses(20)
    return {"analyses": analyses}

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
