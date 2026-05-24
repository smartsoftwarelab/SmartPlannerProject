// frontend/src/components/StepThree.js
import React, { useState } from 'react';

const StepThree = ({ planData, updateData, onNext, onBack }) => {
    const [preferences, setPreferences] = useState(planData.preferences || '');

    const handleNext = () => {
        updateData({ preferences: preferences });
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
                            <h1>گام سوم</h1>
                            <p>ترجیحات و جزئیات بیشتر</p>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    <div className="step-screen">
                        <div className="input-group">
                            <label>ترجیحات (اختیاری)</label>
                            <textarea
                                value={preferences}
                                onChange={(e) => setPreferences(e.target.value)}
                                placeholder="اگه ترجیح خاصی داری اینجا بنویس..."
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

export default StepThree;
