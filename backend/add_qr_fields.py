import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE user_settings ADD COLUMN company_upi_id VARCHAR"))
        print("Successfully added company_upi_id column")
    except Exception as e:
        print(f"Error adding company_upi_id: {e}")
        
    try:
        conn.execute(text("ALTER TABLE user_settings ADD COLUMN company_qr_code TEXT"))
        print("Successfully added company_qr_code column")
    except Exception as e:
        print(f"Error adding company_qr_code: {e}")
    conn.commit()
