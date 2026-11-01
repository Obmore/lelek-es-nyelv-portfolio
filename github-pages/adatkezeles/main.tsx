import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PrivacyPage from '../../app/components/PrivacyPage';
import '../../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivacyPage />
  </StrictMode>,
);
