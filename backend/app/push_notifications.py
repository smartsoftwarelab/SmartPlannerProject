# backend/app/push_notifications.py
from pywebpush import webpush, WebPushException
import json
from datetime import datetime, timedelta
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {
    "sub": "mailto:zrafiei1414@gmail.com"
}


class PushNotificationService:

    def __init__(self):
        self.subscriptions = {}

    def send_notification(self, subscription_info: dict, notification_data: dict):
        try:
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_data),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            return {"success": True, "status_code": response.status_code}
        except WebPushException as ex:
            print(f"Push notification failed: {ex}")
            return {"success": False, "error": str(ex)}

    def send_task_reminder(
            self,
            subscription_info: dict,
            task_name: str,
            start_time: str,
            end_time: str,
            plan_title: str,
            task_id: int
    ):

        notification_data = {
            "title": f"⏰ یادآوری: {task_name}",
            "body": f"{start_time} - {end_time}\n30 دقیقه دیگه شروع میشه!\n📋 {plan_title}",
            "icon": "/icon-192.png",
            "badge": "/icon-192.png",
            "tag": f"task-{task_id}",
            "requireInteraction": True,
            "data": {
                "taskId": task_id,
                "taskName": task_name,
                "startTime": start_time,
                "planTitle": plan_title
            }
        }

        return self.send_notification(subscription_info, notification_data)

    def calculate_reminders_for_plan(self, plan) -> List[Dict]:

        reminders = []
        now = datetime.now()

        for daily_task in plan.daily_tasks:
            for task in daily_task.tasks:
                if not task.is_completed:
                    task_datetime = datetime.combine(
                        daily_task.date.date(),
                        task.start_time
                    )

                    reminder_time = task_datetime - timedelta(minutes=30)

                    if reminder_time > now:
                        reminders.append({
                            "time": reminder_time.isoformat(),
                            "taskId": task.id,
                            "taskName": task.name,
                            "startTime": task.start_time.strftime("%H:%M"),
                            "endTime": task.end_time.strftime("%H:%M"),
                            "planTitle": plan.title,
                            "date": daily_task.date.isoformat()
                        })

        return reminders

    def save_subscription(self, user_id: str, subscription_info: dict):
        self.subscriptions[user_id] = subscription_info
        return True

    def get_subscription(self, user_id: str):
        return self.subscriptions.get(user_id)

    def remove_subscription(self, user_id: str):
        if user_id in self.subscriptions:
            del self.subscriptions[user_id]
            return True
        return False


push_service = PushNotificationService()