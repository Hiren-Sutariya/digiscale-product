import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE products ADD COLUMN unit_type VARCHAR(10) DEFAULT 'pcs'"))
        conn.commit()
        print("Successfully added unit_type to products table.")
    except Exception as e:
        print("Error:", e)
