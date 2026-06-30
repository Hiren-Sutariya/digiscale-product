from fastapi import FastAPI

app = FastAPI(
    title="DigiScale Product Studio API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to DigiScale Product Studio API 🚀"
    }

@app.get("/health")
def health():
    return {
        "status": "OK",
        "service": "Backend Running"
    }
