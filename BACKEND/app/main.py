from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .problems import router as problems_router
from .settings import router as settings_router
from .session import router as session_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(problems_router)
app.include_router(settings_router)
app.include_router(session_router)

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
