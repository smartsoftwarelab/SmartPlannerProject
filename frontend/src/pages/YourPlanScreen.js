// frontend/src/pages/YourPlanScreen.js
import React, { useState, useEffect } from 'react';
import { planService } from '../services/planService';

const YourPlanScreen = ({ planData, llmPlanOutput, setLlmPlanOutput, onConfirm, onBackToForm, updatePlanData }) => {
    const [currentPlan, setCurrentPlan] = useState(llmPlanOutput);
    const [isLoading, setIsLoading] = useState(false);
    const [showRefineModal, setShowRefineModal] = useState(false);
    const [refinementNote, setRefinementNote] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!llmPlanOutput) {
            const fetchPlan = async () => {
                setIsLoading(true);
                try {
                    const inputDataForAPI = {
                        ...planData,
                        start_date: planData.start_date.toISOString().split('T')[0]
                    };
                    const generatedPlan = await planService.generatePlan(inputDataForAPI);
                    setCurrentPlan(generatedPlan);
                    setLlmPlanOutput(generatedPlan);
                } catch (err) {
                    setError("خطا در برنامه ریزی.");
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlan();
        }
    }, [llmPlanOutput, planData, setLlmPlanOutput]);

    const handleConfirm = async () => {
        if (!currentPlan) return;
        setIsLoading(true);
        try {
            const inputForSave = {
                ...planData,
                start_date: planData.start_date.toISOString().split('T')[0]
            };
            
            const savedPlan = await planService.savePlan(inputForSave, currentPlan);
            alert(`${savedPlan.title} با موفقیت ذخیره شد!`);
            onConfirm();
        } catch (err) {
            setError("خطا در ذخیره");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async () => {
        if (!refinementNote) {
            alert("بگو چه چیزی توی این برنامه لازمه عوض بشه؟");
            return;
        }
        
        setIsLoading(true);
        setShowRefineModal(false);

        try {
            const inputForAPI = {
                ...planData,
                start_date: planData.start_date.toISOString().split('T')[0]
            };

            const refinedPlan = await planService.refinePlan(inputForAPI, refinementNote);
            
            setCurrentPlan(refinedPlan);
            setLlmPlanOutput(refinedPlan);
            setRefinementNote('');
            setError(null);
        } catch (err) {
            console.error("Refine error:", err);
            setError("خطا در بازنویسی برنامه. بعدا دوباره تلاش کن.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotConfirm = () => {
        setShowRefineModal(true);
    };

    if (isLoading) {
        return (
            <div className="app-container">
                <aside className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">📋</div>
                        <div className="logo-text">
                            <h2>برنامه‌ریز هوشمند</h2>
                            <p>مدیریت زمان با AI</p>
                        </div>
                    </div>
                </aside>

                <div className="main-wrapper">
                    <header className="header">
                        <div className="header-top">
                            <div className="greeting">
                                <h1>در حال تولید برنامه...</h1>
                                <p>لطفاً صبر کن، داریم برنامه‌ت رو می‌سازیم</p>
                            </div>
                        </div>
                    </header>

                    <main className="main-content">
                        <div className="loading-screen">
                            ⏳ برنامه در حال تولید است...
                        </div>

                        <div className="button-group" style={{ marginTop: '20px' }}>
                                <button onClick={onBackToForm} className="mint-btn btn-back">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="19" y1="12" x2="5" y2="12"/>
                                        <polyline points="12 19 5 12 12 5"/>
                                    </svg>
                                    بازگشت
                                </button>
                        </div>

                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <aside className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">📋</div>
                        <div className="logo-text">
                            <h2>برنامه‌ریز هوشمند</h2>
                            <p>مدیریت زمان با AI</p>
                        </div>
                    </div>
                </aside>

                <div className="main-wrapper">
                    <header className="header">
                        <div className="header-top">
                            <div className="greeting">
                                <h1>خطا</h1>
                                <p>{error}</p>
                            </div>
                        </div>
                    </header>

                    <main className="main-content">
                        <div className="empty-state">
                            <div className="empty-icon">⚠️</div>
                            <div className="empty-title">مشکلی پیش اومد</div>
                            <div className="empty-text">{error}</div>
                            <div className="button-group" style={{ marginTop: '20px' }}>
                                <button onClick={onBackToForm} className="mint-btn btn-back">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="19" y1="12" x2="5" y2="12"/>
                                        <polyline points="12 19 5 12 12 5"/>
                                    </svg>
                                    بازگشت
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!currentPlan) return null;

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

                </nav>
            </aside>

            {/* Main Wrapper */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="header">
                    <div className="header-top">
                        <div className="greeting">
                            <h1>✨ برنامه شما آماده است!</h1>
                            <p>{currentPlan.plan_overview || 'بررسی کن و تایید یا اصلاح کن'}</p>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn" onClick={onBackToForm} title="بازگشت">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{currentPlan.schedule?.length || 0}</div>
                            <div className="stat-label">روز</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {currentPlan.schedule?.reduce((sum, day) => sum + (day.tasks?.length || 0), 0) || 0}
                            </div>
                            <div className="stat-label">تسک کل</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {Math.round((currentPlan.schedule?.[0]?.tasks?.length || 0) * 1.5)}h
                            </div>
                            <div className="stat-label">ساعت روزانه</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    {/* نمایش برنامه روزانه */}
                    <div className="plan-cards-container">
                        {currentPlan.schedule?.map((day, index) => (
                            <div key={index} className="plan-card">
                                <div className="card-header">
                                    <h4>📅 {day.date}</h4>
                                    <span className="day-number">روز {index + 1}</span>
                                </div>
                                <ul className="task-list">
                                    {day.tasks?.map((task, idx) => (
                                        <li key={idx} className="task-item">
                                            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                <span className="task-name">{task.name}</span>
                                            </div>
                                            <span className="task-time">
                                                {task.start_time} - {task.end_time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* دکمه‌های تایید/عدم تایید */}
                    <div className="button-group" style={{ marginTop: '32px', maxWidth: '600px', margin: '32px auto 0' }}>
                        <button onClick={handleConfirm} className="mint-btn btn-next">
                            تایید و ذخیره
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </button>

                        <button onClick={handleNotConfirm} className="mint-btn btn-back">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            اصلاح برنامه
                        </button>
                    </div>
                </main>
            </div>

            {/* مودال بازنویسی */}
            {showRefineModal && (
                <div className="refine-modal-overlay">
                    <div className="refine-modal">
                        <p>چه چیزی رو میخوای عوض کنم؟</p>
                        <textarea 
                            rows="5"
                            value={refinementNote}
                            onChange={(e) => setRefinementNote(e.target.value)}
                            placeholder="مثلاً: تسک‌های روز اول رو ساده‌تر کن، یا ساعت کار روزانه رو کمتر کن..."
                        />
                        <div className="button-group">
                            <button onClick={handleRefine} className="mint-btn btn-next">
                                اصلاح کن
                            </button>
                            
                            <button onClick={() => setShowRefineModal(false)} className="mint-btn btn-back">
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YourPlanScreen;