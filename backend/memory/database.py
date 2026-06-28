from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
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
            "created_at": datetime.utcnow(),
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
