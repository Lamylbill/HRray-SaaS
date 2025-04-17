
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error handler for React 18
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

// Wrap rendering in try/catch to catch any initial render errors
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
      <h1 style="color: #e11d48; margin-bottom: 16px; font-size: 24px;">Application Error</h1>
      <p style="margin-bottom: 16px;">We're sorry, but the application failed to start properly.</p>
      <button 
        onclick="window.location.reload()" 
        style="padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Refresh the page
      </button>
    </div>
  `;
}
