# backend/app/notification_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import asyncio
from .database import get_db, PlanDB
from .push_notifications import push_service

router = APIRouter()



class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # شامل p256dh و auth


class SubscribeRequest(BaseModel):
    user_id: str  # یا از JWT بگیر
    subscription: PushSubscription


class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None



@router.post("/subscribe")
async def subscribe_to_push(request: SubscribeRequest):
    try:
        subscription_info = {
            "endpoint": request.subscription.endpoint,
            "keys": request.subscription.keys
        }

        push_service.save_subscription(request.user_id, subscription_info)

        test_notification = {
            "title": "✅ یادآوری‌ها فعال شد!",
            "body": "از این به بعد برای تسک‌هات یادآوری میدم 🎉",
            "icon": "/icon-192.png",
            "badge": "/icon-192.png"
        }

        result = push_service.send_notification(subscription_info, test_notification)

        return {
            "success": True,
            "message": "اشتراک با موفقیت ثبت شد",
            "test_notification_sent": result.get("success", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در ثبت اشتراک: {str(e)}")


@router.post("/unsubscribe")
async def unsubscribe_from_push(user_id: str):
    try:
        removed = push_service.remove_subscription(user_id)
        if removed:
            return {"success": True, "message": "اشتراک با موفقیت لغو شد"}
        else:
            return {"success": False, "message": "اشتراکی یافت نشد"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming-reminders/{user_id}")
async def get_upcoming_reminders(user_id: str, db: Session = Depends(get_db)):
    """
    دریافت لیست یادآوری‌های آینده کاربر
    """
    try:
        plans = db.query(PlanDB).all()

        all_reminders = []
        for plan in plans:
            reminders = push_service.calculate_reminders_for_plan(plan)
            all_reminders.extend(reminders)

        all_reminders.sort(key=lambda x: x['time'])

        return {
            "success": True,
            "count": len(all_reminders),
            "reminders": all_reminders
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedule-plan-reminders/{plan_id}")
async def schedule_plan_reminders(
        plan_id: int,
        user_id: str,
        db: Session = Depends(get_db)
):
    """
    زمان‌بندی تمام یادآوری‌های یک برنامه
    """
    try:
        plan = db.query(PlanDB).filter(PlanDB.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="برنامه یافت نشد")

        subscription = push_service.get_subscription(user_id)
        if not subscription:
            raise HTTPException(
                status_code=400,
                detail="کاربر subscribe نکرده است"
            )

        reminders = push_service.calculate_reminders_for_plan(plan)


        return {
            "success": True,
            "plan_id": plan_id,
            "scheduled_count": len(reminders),
            "reminders": reminders
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-test-notification")
async def send_test_notification(user_id: str):
    """ارسال یک notification تستی"""
    try:
        subscription = push_service.get_subscription(user_id)
        if not subscription:
            raise HTTPException(
                status_code=400,
                detail="کاربر subscribe نکرده است"
            )

        test_data = {
            "title": "🔔 تست یادآوری",
            "body": "این یک پیام تستی است!\nاگه این رو میبینی، یعنی همه چی درست کار می‌کنه ✅",
            "icon": "/icon-192.png",
            "badge": "/icon-192.png",
            "requireInteraction": True
        }

        result = push_service.send_notification(subscription, test_data)

        return {
            "success": result.get("success", False),
            "message": "Notification sent" if result.get("success") else "Failed to send"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



async def reminder_scheduler(db: Session):
    while True:
        try:
            now = datetime.now()

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

                            time_diff = (reminder_time - now).total_seconds()
                            if 0 <= time_diff <= 60:
                                for user_id, subscription in push_service.subscriptions.items():
                                    push_service.send_task_reminder(
                                        subscription,
                                        task.name,
                                        task.start_time.strftime("%H:%M"),
                                        task.end_time.strftime("%H:%M"),
                                        plan.title,
                                        task.id
                                    )

            await asyncio.sleep(60)

        except Exception as e:
            print(f"Error in reminder scheduler: {e}")
            await asyncio.sleep(60)