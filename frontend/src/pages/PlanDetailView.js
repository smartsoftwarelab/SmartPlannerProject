// frontend/src/pages/PlanDetailView.js
import React, { useState } from 'react';
import { planService } from '../services/planService';

const PlanDetailView = ({ plan, onBack }) => {
    const [localPlan, setLocalPlan] = useState(plan);

    if (!localPlan) return <div className="loading-screen">در حال بارگذاری...</div>;

    const toggleTask = async (dayIndex, taskId) => {
        const updatedPlan = { ...localPlan };
        const task = updatedPlan.daily_tasks[dayIndex].tasks.find(t => t.id === taskId);
        
        if (task) {
            const newStatus = !task.is_completed;
            task.is_completed = newStatus;
            setLocalPlan({ ...updatedPlan });

            try {
                await planService.updateTaskStatus(taskId, newStatus);
            } catch (error) {
                console.error("خطا در ذخیره وضعیت تسک:", error);
                task.is_completed = !newStatus;
                setLocalPlan({ ...updatedPlan });
                alert("وضعیت جدید ذخیره نشد.");
            }
        }
    };

    const calculateProgress = () => {
        let total = 0;
        let completed = 0;
        
        localPlan.daily_tasks?.forEach(day => {
            day.tasks?.forEach(task => {
                total++;
                if (task.is_completed) completed++;
            });
        });
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const progress = calculateProgress();

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

                <nav className="nav-menu">
                    <button className="nav-menu-item active" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        صفحه اصلی
                    </button>
                </nav>
            </aside>

            {/* Main Wrapper */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="header">
                    <div className="header-top">
                        <div className="greeting">
                            <h1>{localPlan.title || 'برنامه'}</h1>
                            <p>{localPlan.plan_overview || localPlan.goal || 'جزئیات برنامه'}</p>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn" onClick={onBack} title="بازگشت">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{localPlan.daily_tasks?.length || 0}</div>
                            <div className="stat-label">روز</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {localPlan.daily_tasks?.reduce((sum, day) => sum + (day.tasks?.length || 0), 0) || 0}
                            </div>
                            <div className="stat-label">تسک کل</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{progress}%</div>
                            <div className="stat-label">پیشرفت</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    <div className="plan-cards-container">
                        {localPlan.daily_tasks && localPlan.daily_tasks.length > 0 ? (
                            localPlan.daily_tasks.map((day, dayIndex) => (
                                <div className="plan-card" key={dayIndex}>
                                    <div className="card-header">
                                        <h4>📅 {new Date(day.date).toLocaleDateString('fa-IR')}</h4>
                                        <span className="day-number">روز {dayIndex + 1}</span>
                                    </div>
                                    
                                    <ul className="task-list">
                                        {day.tasks && day.tasks.map((task) => (
                                            <li 
                                                key={task.id} 
                                                className="task-item"
                                                onClick={() => toggleTask(dayIndex, task.id)}
                                            >
                                                {/* سمت راست: Checkbox + نام تسک */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    flex: 1,
                                                    gap: '12px'
                                                }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!task.is_completed} 
                                                        readOnly 
                                                        style={{ 
                                                            width: '18px', 
                                                            height: '18px', 
                                                            accentColor: 'var(--primary-green)',
                                                            cursor: 'pointer',
                                                            flexShrink: 0
                                                        }} 
                                                    />
                                                    <span 
                                                        className={`task-name ${task.is_completed ? 'line-through' : ''}`}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {task.name}
                                                    </span>
                                                </div>

                                                {/* سمت چپ: ساعت */}
                                                <span 
                                                    className="task-time"
                                                    style={{ 
                                                        flexShrink: 0,
                                                        marginLeft: '12px'
                                                    }}
                                                >
                                                    {task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">برنامه‌ای یافت نشد</div>
                                <div className="empty-text">اطلاعات برنامه کامل نیست</div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlanDetailView;