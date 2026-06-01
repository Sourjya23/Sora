from fastapi import FastAPI, BackgroundTasks
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection
from app.jobs.mail_automations import run_upcoming_interview_reminders, run_admin_pending_profiles_digest

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    print("🚀 Starting Python Microservice...")
    await connect_to_mongo()
    
    # Initialize APScheduler for Cron Jobs
    # 1. Upcoming Interview Reminders: Daily at 8:00 AM
    scheduler.add_job(run_upcoming_interview_reminders, 'cron', hour=8, minute=0, id='upcoming_interviews')
    
    # 2. Admin Reminders for Pending Profiles: Weekly on Monday at 9:00 AM
    scheduler.add_job(run_admin_pending_profiles_digest, 'cron', day_of_week='mon', hour=9, minute=0, id='admin_profiles')
    
    scheduler.start()
    print("✅ APScheduler started successfully.")
    
    yield
    
    # Shutdown Events
    print("🛑 Shutting down Python Microservice...")
    scheduler.shutdown()
    await close_mongo_connection()

app = FastAPI(title="Sora Python Microservice", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Python Microservice is running!", "status": "active"}

@app.post("/api/trigger/interviews")
async def trigger_interviews(background_tasks: BackgroundTasks):
    """Endpoint for Node.js server to manually trigger interview reminders"""
    background_tasks.add_task(run_upcoming_interview_reminders)
    return {"message": "Triggered upcoming interview reminders."}

@app.post("/api/trigger/admin-digest")
async def trigger_admin_digest(background_tasks: BackgroundTasks):
    """Endpoint for Node.js server to manually trigger the admin digest"""
    background_tasks.add_task(run_admin_pending_profiles_digest)
    return {"message": "Triggered admin digest for pending profiles."}
