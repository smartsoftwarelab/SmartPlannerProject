// frontend/src/pages/PersonalityPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PersonalityPage = ({ onBack }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const response = await axios.get('http://localhost:8000/analyze-behavior/');
                setAnalysis(response.data);
            } catch (err) {
                console.error("Analysis failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

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
                            <h1>تحلیل رفتاری</h1>
                            <p>نمای کامل از عملکرد شما</p>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn" onClick={onBack} title="بازگشت">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    {loading ? (
                        <div className="loading-screen">آنالیز رفتاری شما...</div>
                    ) : (
                        <div className="personality-page-container">
                            <div className="personality-content">
                                {/* Behavioral Snapshot */}
                                <div className='personality-card'>
                                    <section className="personality-section">
                                        <h3 className="section-title">نمای رفتار شما</h3>
                                        <p className="section-text">{analysis?.behavioral_snapshot}</p>
                                    </section>
                                </div>

                                {/* Strengths */}
                                <div className='personality-card'>
                                    <section className="personality-section">
                                        <h3 className="section-title">نقاط قوت</h3>
                                        <div className="section-list">
                                            {analysis?.strengths.map((s, i) => (
                                                <div key={i} className="list-item">
                                                    ✦ {s}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Risk Patterns */}
                                <div className='personality-card'>
                                    <section className="personality-section">
                                        <h3 className="section-title">نقاط قابل اصلاح</h3>
                                        <div className="section-list">
                                            {analysis?.risk_patterns.map((r, i) => (
                                                <div key={i} className="list-item">
                                                    • {r}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Actionable Steps */}
                                <div className='personality-card'>
                                    <section className="personality-section">
                                        <h3 className="section-title">اصلاحات کوچک</h3>
                                        {analysis?.actionable_adjustments.map((step, i) => (
                                            <div key={i} className="action-item">
                                                <p className="action-title">{step.adjustment}</p>
                                                <p className="action-description">{step.rationale}</p>
                                            </div>
                                        ))}
                                    </section>
                                </div>

                                {/* Scope Notice */}
                                {analysis?.scope_notice && (
                                    <div className='personality-card'>
                                        <p className="section-text">{analysis.scope_notice}</p>
                                    </div>
                                )}

                                <div className="button-group">
                                    <button onClick={onBack} className="mint-btn btn-back">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12"></line>
                                            <polyline points="12 19 5 12 12 5"></polyline>
                                        </svg>
                                        بازگشت
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PersonalityPage;
