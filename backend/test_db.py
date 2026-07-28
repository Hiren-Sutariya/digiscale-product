import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models.user import User
from app.models.project import Project
from app.models.user_settings import UserSettings

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    user = db.query(User).first()
    print("Success loading user")
except Exception as e:
    print(f"Error: {e}")
