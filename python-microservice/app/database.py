import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env variables from the main server .env file or a local .env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/interview-platform")

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    print(f"Connecting to MongoDB at {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI}")
    db.client = AsyncIOMotorClient(MONGO_URI)
    print("Connected to MongoDB successfully!")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("MongoDB connection closed.")

def get_database():
    return db.client.get_default_database()
