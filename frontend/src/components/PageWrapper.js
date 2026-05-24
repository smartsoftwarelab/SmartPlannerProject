// frontend/src/components/PageWrapper.js
import React from 'react';

const PageWrapper = ({ children, title, subtitle, onBack, showSidebar = false, onGoToPersonality, onStartNewPlan }) => {
    return (
        <div className="app-container">
            {/* Sidebar (Desktop Only) */}
            {showSidebar && (
                <aside className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">📋</div>
                        <div className="logo-text">
                            <h2>برنامه‌ریز هوشمند</h2>
                            <p>مدیریت زمان با AI</p>
                        </div>
                    </div>

                    <nav className="nav-menu">
                        <button className="nav-menu-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                            صفحه اصلی
                        </button>
                        {onStartNewPlan && (
                            <button className="nav-menu-item" onClick={onStartNewPlan}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                </svg>
                                برنامه جدید
                            </button>
                        )}
                        <button className="nav-menu-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            تسک‌های امروز
                        </button>
                        {onGoToPersonality && (
                            <button className="nav-menu-item" onClick={onGoToPersonality}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                تحلیل رفتاری
                            </button>
                        )}
                    </nav>
                </aside>
            )}

            {/* Main Wrapper */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="header">
                    <div className="header-top">
                        <div className="greeting">
                            <h1>{title}</h1>
                            {subtitle && <p>{subtitle}</p>}
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
                </header>

                {/* Main Content */}
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PageWrapper;