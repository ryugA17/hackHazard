import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Only use StrictMode in development
if (process.env.NODE_ENV === 'development') {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  root.render(<App />);
}

// Only report web vitals in production and don't log to console
reportWebVitals(process.env.NODE_ENV === 'production' 
  ? (metric) => {
    // Send to analytics service if needed
    // This avoids console logging in production
  } 
  : console.log
);

// Register service worker for offline capabilities and faster loading
serviceWorker.register({
  onUpdate: registration => {
    // Auto update when new version is available
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.update();
      window.location.reload();
    }
  }
}); 