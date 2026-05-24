# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, time
from typing import List
from pydantic import BaseModel
from . import schemas
from .database import PlanDB, get_db, init_db, DailyTaskDB, TaskItemDB
from .agent import plan_generation_chain, create_refine_chain
from .database import PlanDB
from .agent import behavior_analysis_chain
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .notification_routes import router as notification_router
from .scheduler import start_scheduler, shutdown_scheduler

init_db()

app = FastAPI(title="LLM Planner API")
app.include_router(notification_router, tags=["notifications"])

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#test
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("--- VALIDATION ERROR DETAILS ---")
    print(exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

def save_plan_to_db(db: Session, plan_input: schemas.PlanInput, llm_plan: schemas.StudyPlan):
    try:
        db_plan = PlanDB(
            title=plan_input.title,
            status="Confirmed",
            start_date=datetime.combine(plan_input.start_date, datetime.min.time()),
            plan_overview=llm_plan.plan_overview
        )
        db.add(db_plan)
        db.flush()

        for daily_task_data in llm_plan.schedule:
            db_daily_task = DailyTaskDB(
                plan_id=db_plan.id,
                date=datetime.strptime(daily_task_data.date, "%Y-%m-%d")
            )
            db.add(db_daily_task)
            db.flush()

            for task in daily_task_data.tasks:
                s_time = datetime.strptime(task.start_time, "%H:%M").time()
                e_time = datetime.strptime(task.end_time, "%H:%M").time()

                db_task_item = TaskItemDB(
                    daily_task_id=db_daily_task.id,
                    name=task.name,
                    start_time=s_time,
                    end_time=e_time
                )
                db.add(db_task_item)

        db.commit()
        db.refresh(db_plan)
        return db_plan
    except Exception as e:
        db.rollback()
        print(f"--- DATABASE SAVE ERROR ---")
        import traceback
        traceback.print_exc()
        raise e

class RefinementRequest(BaseModel):
    plan_input: schemas.PlanInput
    refinement_note: str

@app.post("/generate_plan/", response_model=schemas.StudyPlan)
async def generate_plan_api(plan_input: schemas.PlanInput):
    #test
    input_data = {
        "tasks": plan_input.tasks,
        "timeframe": plan_input.duration,
        "daily_hours": plan_input.daily_hours,
        "preferences": plan_input.preferences,
    }

    try:
        llm_response = await plan_generation_chain.ainvoke(input_data)
        return llm_response
    except Exception as e:
        #test
        import traceback
        print("--- LLM ERROR TRACEBACK ---")
        traceback.print_exc()
        print("---------------------------")

        raise HTTPException(status_code=500, detail=f"LLM Generation Failed: {e}")


@app.post("/refine_plan/", response_model=schemas.StudyPlan)
async def refine_plan_api(request: RefinementRequest):
    try:
        refine_chain = create_refine_chain(request.refinement_note)

        input_data = {
            "tasks": request.plan_input.tasks,
            "timeframe": request.plan_input.duration,
            "daily_hours": request.plan_input.daily_hours,
            "preferences": request.plan_input.preferences,
            "start_date": str(request.plan_input.start_date)
        }

        llm_response = await refine_chain.ainvoke(input_data)
        return llm_response

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"error in plan refinement {str(e)}")

@app.post("/save_plan/", response_model=schemas.PlanSummary, status_code=201)
def save_plan_api(plan_input: schemas.PlanInput, llm_plan: schemas.StudyPlan, db: Session = Depends(get_db)):
    try:
        db_plan = save_plan_to_db(db, plan_input, llm_plan)
        return db_plan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Save Failed: {e}")

@app.get("/plans/", response_model=List[schemas.PlanSummary])
def get_all_plans(db: Session = Depends(get_db)):
    return db.query(PlanDB).order_by(PlanDB.created_at.desc()).all()

@app.get("/plans/{plan_id}", response_model=schemas.FullPlanOut)
def get_plan_details(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(PlanDB).filter(PlanDB.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@app.put("/tasks/{task_id}/complete", response_model=schemas.TaskItemOut)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskItemDB).filter(TaskItemDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_completed = not task.is_completed
    db.commit()
    db.refresh(task)
    return task


@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    db_plan = db.query(PlanDB).filter(PlanDB.id == plan_id).first()

    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    try:
        db.delete(db_plan)
        db.commit()
        return {"message": "Plan deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/analyze-behavior/")
async def analyze_user_behavior(db: Session = Depends(get_db)):
    plans = db.query(PlanDB).all()

    if not plans:
        return {
            "behavioral_analysis": "هنوز داده‌ای برای تحلیل وجود ندارد. ابتدا چند برنامه بسازید.",
            "strengths": ["در انتظار داده"],
            "weaknesses": ["در انتظار داده"]
        }

    history_summary = []
    for p in plans:
        history_summary.append(f"Plan: {p.title} (Overview: {p.plan_overview})")
        for dt in p.daily_tasks:
            for t in dt.tasks:
                status = "Completed" if t.is_completed else "Not Completed"
                history_summary.append(
                    f"- Task: {t.name}, Time: {t.start_time}-{t.end_time}, Status: {status}"
                )

    history_text = "\n".join(history_summary)

    try:
        analysis_result = await behavior_analysis_chain.ainvoke({"history_data": history_text})
        return analysis_result
    except Exception as e:
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="error in behavioral analyze")


@app.on_event("startup")
async def startup_event():
    start_scheduler()
    print("✅ Reminder scheduler started!")

@app.on_event("shutdown")
async def shutdown_event():
    shutdown_scheduler()
    print("❌ Reminder scheduler stopped!")