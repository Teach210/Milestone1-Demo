import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx'; // Import App instead of Dashboard

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App /> {/* Render App so routing works */}
  </StrictMode>
);
