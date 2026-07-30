import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.cqgkbapowszjhfeqalnv:DigiScale%402026@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT id, email, hashed_password FROM users WHERE email = 'hiren@gmail.com'"))
        user = result.fetchone()
        if user:
            print("User found:", user)
        else:
            print("User not found!")

asyncio.run(main())
