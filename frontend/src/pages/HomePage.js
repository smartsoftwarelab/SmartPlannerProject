// frontend/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { planService } from '../services/planService';
import pushNotificationService from '../services/pushNotificationService';

const PlanBox = ({ plan, onSelectPlan, onDeletePlan }) => {
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (window.confirm("مطمئنی حذفش کنم؟")) {
            onDeletePlan(plan.id);
        }
    };

    const calculateProgress = () => {
        if (!plan.progress || plan.progress.total === 0) return 0;
        return Math.round((plan.progress.completed / plan.progress.total) * 100);
    };

    const progress = calculateProgress();
    
    const getDuration = () => {
        if (plan.daily_tasks && plan.daily_tasks.length > 0) {
            return plan.daily_tasks.length;
        }
        return 0;
    };

    return (
        <div className="plan-card" onClick={() => onSelectPlan(plan)} style={{ position: 'relative' }}> 
            <div className="plan-card-header">
                <div className="plan-info">
                    <h3>{plan.title}</h3>
                    <div className="plan-meta">
                        <span className="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            {new Date(plan.start_date).toLocaleDateString('fa-IR')}
                        </span>
                        {getDuration() > 0 && (
                            <span className="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                {getDuration()} روز
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={handleDeleteClick} className="delete-btn">×</button>
            </div>
            
            <div className="progress-section">
                <div className="progress-header">
                    <span className="progress-label">
                        {plan.progress?.completed || 0} از {plan.progress?.total || 0} تسک
                    </span>
                    <span className="progress-percentage">{progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const HomePage = ({ onStartNewPlan, onSelectPlan, onGoToPersonality }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleDeletePlan = async (planId) => {
        try {
            await planService.deletePlan(planId);
            setPlans(plans.filter(p => p.id !== planId));
        } catch (error) {
            console.error("Failed to delete plan:", error);
            alert("نتونستم حذف کنم. بعداً دوباره تلاش کن.");
        }
    };

    const setupPushNotifications = async () => {
        try {
            const result = await pushNotificationService.enablePushNotifications();
            
            if (result.success) {
                alert('✅ یادآوری‌ها فعال شد!');
                for (const plan of plans) {
                    await pushNotificationService.schedulePlanReminders(plan.id);
                }
            } else {
                alert('❌ خطا: ' + result.error);
            }
        } catch (error) {
            console.error('Setup failed:', error);
            alert('خطا در فعال‌سازی یادآوری‌ها');
        }
    };

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const plansData = await planService.fetchPlans();
                
                const plansWithProgress = await Promise.all(
                    plansData.map(async (plan) => {
                        try {
                            const fullPlan = await planService.fetchPlanDetails(plan.id);
                            
                            let totalTasks = 0;
                            let completedTasks = 0;
                            
                            fullPlan.daily_tasks?.forEach(day => {
                                day.tasks?.forEach(task => {
                                    totalTasks++;
                                    if (task.is_completed) {
                                        completedTasks++;
                                    }
                                });
                            });
                            
                            return {
                                ...plan,
                                daily_tasks: fullPlan.daily_tasks,
                                progress: {
                                    total: totalTasks,
                                    completed: completedTasks
                                }
                            };
                        } catch (error) {
                            console.error(`Error fetching plan ${plan.id}:`, error);
                            return {
                                ...plan,
                                progress: { total: 0, completed: 0 }
                            };
                        }
                    })
                );
                
                setPlans(plansWithProgress);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPlans();
    }, []);

    const getTotalStats = () => {
        const totalPlans = plans.length;
        const totalTasks = plans.reduce((sum, plan) => sum + (plan.progress?.total || 0), 0);
        const completedTasks = plans.reduce((sum, plan) => sum + (plan.progress?.completed || 0), 0);
        const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return { totalPlans, totalTasks, completedTasks, overallProgress };
    };

    const stats = getTotalStats();

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
                    <button className="nav-menu-item active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        صفحه اصلی
                    </button>
                    <button className="nav-menu-item" onClick={onStartNewPlan}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                        </svg>
                        برنامه جدید
                    </button>
                    <button className="nav-menu-item" onClick={onGoToPersonality}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        تحلیل رفتاری
                    </button>
                </nav>
            </aside>

            {/* Main Wrapper */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="header">
                    <div className="header-top">
                        <div className="greeting">
                            <h1>👋 سلام!</h1>
                            <p>برنامه‌های امروزت رو مدیریت کن</p>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn" title="جستجو">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35"/>
                                </svg>
                            </button>
                            <button className="icon-btn" title="اعلان‌ها" onClick={setupPushNotifications}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalPlans}</div>
                            <div className="stat-label">برنامه فعال</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalTasks}</div>
                            <div className="stat-label">تسک کل</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.overallProgress}%</div>
                            <div className="stat-label">پیشرفت</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    {/* Notification Banner */}
                    {plans.length > 0 && (
                        <div className="notification-banner" onClick={setupPushNotifications}>
                            <div className="notification-icon">🔔</div>
                            <div className="notification-content">
                                <div className="notification-title">یادآوری‌های هوشمند</div>
                                <div className="notification-text">برای دریافت یادآوری 30 دقیقه قبل هر تسک، فعال کن</div>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </div>
                    )}

                    {/* Section Header */}
                    <div className="section-header">
                        <h2 className="section-title">
                            <span>📋</span>
                            برنامه‌های من
                        </h2>
                    </div>

                    {/* Plans Grid */}
                    <div className="plans-grid">
                        {loading ? (
                            <div className="loading-screen">بارگذاری برنامه‌ها...</div>
                        ) : plans.length > 0 ? (
                            plans.map(plan => (
                                <PlanBox 
                                    key={plan.id} 
                                    plan={plan} 
                                    onSelectPlan={onSelectPlan} 
                                    onDeletePlan={handleDeletePlan}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">هنوز برنامه‌ای نساختی!</div>
                                <div className="empty-text">روی دکمه + کلیک کن و اولین برنامه‌ت رو بساز</div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* FAB */}
            <button className="fab" onClick={onStartNewPlan} title="ساخت برنامه جدید">+</button>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button className="nav-item active">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    <span className="nav-label">خانه</span>
                </button>
                <button className="nav-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    <span className="nav-label">تسک‌ها</span>
                </button>
                <button className="nav-item" onClick={onGoToPersonality}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="nav-label">پروفایل</span>
                </button>
            </nav>
        </div>
    );
};

export default HomePage;