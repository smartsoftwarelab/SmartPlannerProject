# backend/app/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, time


class PlanInput(BaseModel):
    title: str
    tasks: str
    start_date: date
    duration: str
    daily_hours: str
    preferences: str


class PlanSummary(BaseModel):
    id: int
    title: str
    status: str
    start_date: datetime

    class Config:
        from_attributes = True


class TaskItemOut(BaseModel):
    id: int
    name: str
    start_time: time
    end_time: time
    is_completed: bool

    class Config:
        from_attributes = True


class DailyTaskOut(BaseModel):
    id: int
    date: datetime
    # focus حذف شد
    tasks: List[TaskItemOut]

    class Config:
        from_attributes = True


class FullPlanOut(PlanSummary):
    plan_overview: str
    daily_tasks: List[DailyTaskOut]

    class Config:
        from_attributes = True


class TaskSlot(BaseModel):
    name: str
    start_time: str
    end_time: str


class DaySchedule(BaseModel):
    date: str
    tasks: List[TaskSlot]


class StudyPlan(BaseModel):
    plan_overview: str
    daily_hours: str
    schedule: List[DaySchedule]