from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.pet_profile import router as pet_router
from routers.insurance_claim import router as claim_router

app = FastAPI(title="HanaThePet API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pet_router)
app.include_router(claim_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "hanathepet-api"}
