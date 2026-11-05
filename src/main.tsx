import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { ThemeProvider } from './themes/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <SiteConfigProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </SiteConfigProvider>
);
