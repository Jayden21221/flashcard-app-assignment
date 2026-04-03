from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.flashcard_db
collection = db.cards

class Flashcard(BaseModel):
    question: str
    answer: str

@app.get("/cards")
async def get_cards():
    cards = []
    async for card in collection.find():
        cards.append({"id": str(card["_id"]), "question": card.get("question"), "answer": card.get("answer")})
    return cards

@app.post("/cards")
async def create_card(card: Flashcard):
    new_card = await collection.insert_one(card.dict())
    return {"id": str(new_card.inserted_id), **card.dict()}

@app.delete("/cards/{card_id}")
async def delete_card(card_id: str):
    result = await collection.delete_one({"_id": ObjectId(card_id)})
    if result.deleted_count == 1:
        return {"message": "Success"}
    raise HTTPException(status_code=404, detail="Not found")

@app.get("/")
def home():
    return {"message": "Flashcard API is running!"}
