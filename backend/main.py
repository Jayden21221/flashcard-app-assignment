from fastapi import FastAPI, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

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


def _sanitize_payload(card: Flashcard) -> dict:
    question = card.question.strip()
    answer = card.answer.strip()
    if not question or not answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question and answer cannot be empty.")
    return {"question": question, "answer": answer}


def _parse_object_id(card_id: str) -> ObjectId:
    try:
        return ObjectId(card_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid card id format.")

@app.get("/cards")
async def get_cards():
    cards = []
    async for card in collection.find():
        cards.append({"id": str(card["_id"]), "question": card.get("question"), "answer": card.get("answer")})
    return cards

@app.post("/cards")
async def create_card(card: Flashcard):
    payload = _sanitize_payload(card)
    new_card = await collection.insert_one(payload)
    return {
        "id": str(new_card.inserted_id),
        "question": payload["question"],
        "answer": payload["answer"],
    }

@app.put("/cards/{card_id}")
async def update_card(card_id: str, card: Flashcard):
    payload = _sanitize_payload(card)
    object_id = _parse_object_id(card_id)
    result = await collection.update_one({"_id": object_id}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")
    return {"message": "Success"}

@app.delete("/cards/{card_id}")
async def delete_card(card_id: str):
    object_id = _parse_object_id(card_id)
    result = await collection.delete_one({"_id": object_id})
    if result.deleted_count == 1:
        return {"message": "Success"}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")

@app.get("/")
def home():
    return {"message": "Flashcard API is running!"}
