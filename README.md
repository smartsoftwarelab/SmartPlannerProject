markdown
# 📋 برنامه‌ریز هوشمند

یک سیستم برنامه‌ریزی هوشمند مبتنی بر AI

## ویژگی‌ها
- تولید برنامه با GPT-4
- تقویم شمسی
- مدیریت تسک‌ها
- یادآوری‌های هوشمند
- تحلیل رفتار کاربر

## فناوری‌ها
- Frontend: React.js + PWA
- Backend: FastAPI (Python)
- Database: PostgreSQL
- AI: LangChain + GPT-4

## نصب

### Backend

bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload


### Frontend

bash
cd frontend
npm install
npm start


## تنظیمات

فایل `.env` در backend:

env
DATABASE_URL=postgresql://user:pass@localhost/dbname
OPENAI_API_KEY=your_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_PUBLIC_KEY=your_public_key


## مجوز
MIT License