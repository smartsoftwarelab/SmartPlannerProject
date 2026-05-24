# backend/app/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, PlanDB
from .push_notifications import push_service
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def check_and_send_reminders():
    db = SessionLocal()
    try:
        now = datetime.now()
        logger.info(f"Checking reminders at {now}")

        plans = db.query(PlanDB).all()

        for plan in plans:
            for daily_task in plan.daily_tasks:
                for task in daily_task.tasks:
                    if not task.is_completed:
                        task_datetime = datetime.combine(
                            daily_task.date.date(),
                            task.start_time
                        )
                        reminder_time = task_datetime - timedelta(minutes=30)

                        time_diff = abs((reminder_time - now).total_seconds())
                        if time_diff <= 120:
                            logger.info(f"Sending reminder for task: {task.name}")
                            for user_id, subscription in push_service.subscriptions.items():
                                try:
                                    push_service.send_task_reminder(
                                        subscription,
                                        task.name,
                                        task.start_time.strftime("%H:%M"),
                                        task.end_time.strftime("%H:%M"),
                                        plan.title,
                                        task.id
                                    )
                                    logger.info(f"Reminder sent to user {user_id}")
                                except Exception as e:
                                    logger.error(f"Failed to send reminder: {e}")

    except Exception as e:
        logger.error(f"Error in reminder check: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        check_and_send_reminders,
        trigger=IntervalTrigger(minutes=1),
        id='check_reminders',
        name='Check and send reminders',
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started!")


def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped!")