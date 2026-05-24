// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ثبت service worker برای PWA
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('برنامه برای استفاده آفلاین آماده است! 🎉');
  },
  onUpdate: (registration) => {
    console.log('نسخه جدید در دسترس است!');
    // می‌توانید اینجا یک notification به کاربر نمایش دهید
    if (window.confirm('نسخه جدید برنامه در دسترس است. می‌خواهید به‌روزرسانی کنید؟')) {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  },
});