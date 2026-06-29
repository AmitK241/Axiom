from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone
import os

load_dotenv()

client = None
db = None

async def connect_db():
    global client, db
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("⚠️  No MongoDB URI — running without persistence")
        return
    try:
        client = AsyncIOMotorClient(uri)
        db = client[os.getenv("MONGODB_DB", "axiom")]
        await client.admin.command("ping")
        print("✅ MongoDB connected")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        db = None

async def disconnect_db():
    global client
    if client:
        client.close()

async def save_analysis(field: str, result: dict) -> str:
    if db is None:
        return "no-db"
    try:
        doc = {
            "field": field,
            "result": result,
            # datetime.now(timezone.utc) is timezone-aware; Motor stores it
            # as a proper BSON UTC Date instead of a naive datetime.
            "created_at": datetime.now(timezone.utc),
            "overall_score": result.get("overall_blind_spot_score", 0),
            "matrix": result.get("matrix", "epistemic"),
        }
        res = await db.analyses.insert_one(doc)
        return str(res.inserted_id)
    except Exception as e:
        print(f"Save error: {e}")
        return "save-failed"

async def get_recent_analyses(limit: int = 10) -> list:
    if db is None:
        return []
    try:
        cursor = db.analyses.find(
            {},
            {"field": 1, "overall_score": 1, "created_at": 1, "_id": 1, "matrix": 1}
        ).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            d["_id"] = str(d["_id"])
            # ── THE ROOT-CAUSE FIX ──────────────────────────────────────────
            # Python datetime objects serialized by FastAPI/Motor produce strings
            # like "2026-06-29T05:52:00.123" (no trailing Z). JavaScript's
            # new Date() spec-mandates treating timezone-less ISO strings as
            # LOCAL time, so on an IST machine the browser interprets 05:52 as
            # IST 05:52 — not UTC 05:52 (which is IST 11:22). The fix: always
            # emit the timestamp as a Z-suffixed UTC string so new Date() in
            # the browser correctly parses it as UTC before locale conversion.
            # ───────────────────────────────────────────────────────────────
            if d.get("created_at") is not None:
                ts = d["created_at"]
                if isinstance(ts, datetime):
                    # Emit milliseconds + explicit Z suffix
                    d["created_at"] = (
                        ts.strftime("%Y-%m-%dT%H:%M:%S.")
                        + f"{ts.microsecond // 1000:03d}Z"
                    )
                elif isinstance(ts, str):
                    # Guard: if an older document already has a string, ensure
                    # it carries a UTC marker so JS parses it correctly.
                    if not ts.endswith("Z") and "+00:00" not in ts and "+05:30" not in ts:
                        d["created_at"] = ts + "Z"
        return docs
    except Exception as e:
        print(f"Fetch error: {e}")
        return []

async def get_analysis_by_id(analysis_id: str) -> dict | None:
    if db is None:
        return None
    try:
        from bson import ObjectId
        doc = await db.analyses.find_one({"_id": ObjectId(analysis_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        print(f"Fetch by id error: {e}")
        return None
