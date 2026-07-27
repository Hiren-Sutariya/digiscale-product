from app.database import engine
from sqlalchemy import text

def create_indexes():
    with engine.connect() as conn:
        print("Creating indexes on products table...")
        # Ignore errors if index already exists
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);"))
            conn.commit()
            print("Products indexes created!")
        except Exception as e:
            print(f"Error: {e}")
            
        print("Creating indexes on collections table...")
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);"))
            conn.commit()
            print("Collections indexes created!")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    create_indexes()
