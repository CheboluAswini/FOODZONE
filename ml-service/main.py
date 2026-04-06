from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn
import random

app = FastAPI(title="FoodZone ML Recommendation Service")

class UserContext(BaseModel):
    user_id: str
    location: str = None
    time_of_day: str = None

class Recommendation(BaseModel):
    item_id: str
    score: float
    reason: str

@app.get("/")
def health_check():
    return {"status": "ok", "service": "ML Service"}

@app.post("/recommendations/{user_id}", response_model=List[Recommendation])
def get_recommendations(user_id: str, context: UserContext):
    # Dummy mock implementation before Two-Tower/SASRec integration
    # Ideally, this fetches user candidate generation, scores, and returns
    mock_items = ["1", "2", "3", "4", "5"]
    recommendations = []
    
    for item in mock_items:
        recommendations.append(
            Recommendation(
                item_id=item,
                score=round(random.uniform(0.7, 0.99), 2),
                reason="Trending near you" if not context.time_of_day else f"Perfect for {context.time_of_day}"
            )
        )
    
    # Sort by score descending
    recommendations.sort(key=lambda x: x.score, reverse=True)
    return recommendations

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
