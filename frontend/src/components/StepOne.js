// frontend/src/components/StepOne.js
import React, { useState } from 'react';

const StepOne = ({ planData, updateData, onNext, onBack }) => {
    const [tasksList, setTasksList] = useState(planData.tasks || '');
    const [title, setTitle] = useState(planData.title || '');

    const handleNext = () => {
        if (title.trim() && tasksList.trim()) {
            onNext({ title, tasksList });
        } else {
            alert('لطفاً همه فیلدها رو پر کن');
        }
        updateData({ 
            title: title,
            tasks: tasksList.split('\n').filter(t => t.trim() !== '').join(', ')
        });
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
                            <h1>گام اول</h1>
                            <p>هدف و عنوان برنامه‌ت رو مشخص کن</p>
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
                        <div className="step-dot active"></div>
                        <div className="step-dot"></div>
                        <div className="step-dot"></div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    <div className="step-container">
                        <div className="input-group">
                            <label>عنوان برنامه</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="مثلاً: یادگیری زبان انگلیسی"
                            />
                        </div>

                        <div className="input-group">
                            <label>هدف شما چیست؟</label>
                            <textarea 
                                placeholder="لیست کارهایی که میخوای انجام بدی:" 
                                rows="10"
                                value={tasksList}
                                onChange={(e) => setTasksList(e.target.value)}
                            />
                        </div>

                        <div className="button-group">
                            
                            <button onClick={onBack} className="mint-btn btn-back">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                                قبلی
                            </button>

                            <button onClick={handleNext} className="mint-btn btn-next">
                                بعدی
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StepOne;