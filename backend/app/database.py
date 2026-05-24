# backend/app/database.py
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------- Dependency --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



class PlanDB(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="Draft")
    start_date = Column(DateTime)
    plan_overview = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    daily_tasks = relationship("DailyTaskDB", back_populates="plan", cascade="all, delete-orphan")


class DailyTaskDB(Base):
    __tablename__ = "daily_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    date = Column(DateTime)  # همان date در DaySchedule

    plan = relationship("PlanDB", back_populates="daily_tasks")
    tasks = relationship("TaskItemDB", back_populates="daily_task", cascade="all, delete-orphan")


class TaskItemDB(Base):
    __tablename__ = "task_items"

    id = Column(Integer, primary_key=True, index=True)
    daily_task_id = Column(Integer, ForeignKey("daily_tasks.id"))
    name = Column(String)
    start_time = Column(Time)
    end_time = Column(Time)
    is_completed = Column(Boolean, default=False)

    daily_task = relationship("DailyTaskDB", back_populates="tasks")


def init_db():
    Base.metadata.create_all(bind=engine)
