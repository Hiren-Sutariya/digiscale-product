import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE user_settings ADD COLUMN company_qr_code TEXT;"))
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
