from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from .auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
