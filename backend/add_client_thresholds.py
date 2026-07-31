import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL", "sqlite:///./digiscale.db"))

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE user_settings ADD COLUMN regular_client_threshold INTEGER DEFAULT 10;"))
        print("Added regular_client_threshold column.")
    except Exception as e:
        print(f"Error adding regular_client_threshold: {e}")
        
    try:
        conn.execute(text("ALTER TABLE user_settings ADD COLUMN vip_client_threshold INTEGER DEFAULT 25;"))
        print("Added vip_client_threshold column.")
    except Exception as e:
        print(f"Error adding vip_client_threshold: {e}")

    try:
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error committing: {e}")
