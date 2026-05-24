// frontend/src/components/StepTwo.js
import React, { useState } from 'react';
import DatePicker from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';

const gregorianToJalali = (date) => {
    const g_d = date.getDate();
    const g_m = date.getMonth() + 1;
    const g_y = date.getFullYear();
    
    const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    
    let gy = g_y - 1600;
    let gm = g_m - 1;
    let gd = g_d - 1;
    
    let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
    
    for (let i = 0; i < gm; ++i) {
        g_day_no += g_days_in_month[i];
    }
    
    if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) {
        ++g_day_no;
    }
    
    g_day_no += gd;
    
    let j_day_no = g_day_no - 79;
    
    let j_np = Math.floor(j_day_no / 12053);
    j_day_no = j_day_no % 12053;
    
    let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
    
    j_day_no %= 1461;
    
    if (j_day_no >= 366) {
        jy += Math.floor((j_day_no - 1) / 365);
        j_day_no = (j_day_no - 1) % 365;
    }
    
    let jm = 0;
    for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
        j_day_no -= j_days_in_month[i];
        jm++;
    }
    
    const jd = j_day_no + 1;
    
    return { year: jy, month: jm + 1, day: jd };
};

// تبدیل شمسی به میلادی
const jalaliToGregorian = (j_y, j_m, j_d) => {
    const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    
    let jy = j_y - 979;
    let jm = j_m - 1;
    let jd = j_d - 1;
    
    let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4);
    
    for (let i = 0; i < jm; ++i) {
        j_day_no += j_days_in_month[i];
    }
    
    j_day_no += jd;
    
    let g_day_no = j_day_no + 79;
    
    let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
    g_day_no = g_day_no % 146097;
    
    let leap = true;
    if (g_day_no >= 36525) {
        g_day_no--;
        gy += 100 * Math.floor(g_day_no / 36524);
        g_day_no = g_day_no % 36524;
        
        if (g_day_no >= 365) {
            g_day_no++;
        }
        leap = false;
    }
    
    gy += 4 * Math.floor(g_day_no / 1461);
    g_day_no %= 1461;
    
    if (g_day_no >= 366) {
        leap = false;
        g_day_no--;
        gy += Math.floor(g_day_no / 365);
        g_day_no = g_day_no % 365;
    }
    
    let gm = 0;
    for (let i = 0; g_day_no >= g_days_in_month[i] + (i === 1 && leap ? 1 : 0); i++) {
        g_day_no -= g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
        gm++;
    }
    
    const gd = g_day_no + 1;
    
    return new Date(gy, gm, gd);
};

const StepTwo = ({ planData, updateData, onNext, onBack }) => {
    const initialDate = planData.start_date || new Date();
    const jalaliDate = gregorianToJalali(initialDate);
    
    const [selectedDay, setSelectedDay] = useState(jalaliDate);
    const [duration, setDuration] = useState(planData.duration || '');
    const [dailyHours, setDailyHours] = useState(planData.daily_hours || '');

    const handleNext = () => {
        if (!duration) {
            alert("لطفا مدت زمان کلی را وارد کنید.");
            return;
        }

        const finalDailyHours = dailyHours || 0;
        const hours = parseFloat(finalDailyHours);
        
        if (hours < 0 || hours > 24) {
            alert("ساعات روزانه باید بین ۰.۵ تا ۲۴ ساعت باشد.");
            return;
        }

        const days = parseInt(duration);
        if (days < 1 || days > 365) {
            alert("مدت زمان باید بین ۱ تا ۳۶۵ روز باشد.");
            return;
        }

        // تبدیل تاریخ شمسی به میلادی برای ذخیره
        const gregorianDate = jalaliToGregorian(
            selectedDay.year,
            selectedDay.month,
            selectedDay.day
        );

        updateData({ 
            start_date: gregorianDate,
            duration: duration,
            daily_hours: dailyHours
        });
        onNext();
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <div className="logo-icon">📋</div>
                    <div className="logo-text">
                        <h2>برنامه‌ریز هوشمند</h2>
                        <p>مدیریت زمان با AI</p>
                    </div>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="header">
                    <div className="header-top">
                        <div className="greeting">
                            <h1>گام دوم</h1>
                            <p>زمان‌بندی برنامه‌ت رو تنظیم کن</p>
                        </div>
                        <div className="header-actions">
                            {onBack && (
                                <button className="icon-btn" onClick={onBack} title="بازگشت">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="progress-steps">
                        <div className="step-dot completed"></div>
                        <div className="step-dot active"></div>
                        <div className="step-dot"></div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    <div className="step-container">
                        <div className="input-group">
                            <label>تاریخ شروع</label>
                            <DatePicker
                                value={selectedDay}
                                onChange={setSelectedDay}
                                locale="fa"
                                shouldHighlightWeekends
                                inputPlaceholder="انتخاب تاریخ"
                                calendarClassName="custom-calendar"
                                inputClassName="custom-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>مدت برنامه (روز)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="1"
                                max="365"
                                placeholder="مثلاً: 30"
                            />
                        </div>

                        <div className="input-group">
                            <label>ساعت کار روزانه (اختیاری)</label>
                            <input
                                type="number"
                                value={dailyHours}
                                onChange={(e) => setDailyHours(e.target.value)}
                                min="0.5"
                                max="24"
                                step="0.5"
                                placeholder="خالی بذار تا هوش مصنوعی پیشنهاد بده"
                            />
                        </div>

                        <div className="button-group">
                            
                            <button onClick={onBack} className="mint-btn btn-back">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="19" y1="12" x2="5" y2="12"/>
                                    <polyline points="12 19 5 12 12 5"/>
                                </svg>
                                قبلی
                            </button>
                            <button onClick={handleNext} className="mint-btn btn-next">
                                بعدی
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </button>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StepTwo;