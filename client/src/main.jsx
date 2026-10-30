import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConsentProvider } from './context/ConsentContext.jsx';
import { CookieBanner, CookiePreferences } from './components/ui/CookieConsent.jsx';
import { Preloader } from './components/ui/Preloader.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';
import { I18nProvider } from './i18n/I18nContext.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 20000 },
  },
});

/** Sonner needs the resolved theme, so it is read inside the provider. */
function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={isDark ? 'dark' : 'light'}
      toastOptions={{ style: { borderRadius: '12px' } }}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ThemeProvider>
          <ConsentProvider>
            <AuthProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
              <Preloader />
              <CookieBanner />
              <CookiePreferences />
              <ThemedToaster />
            </AuthProvider>
          </ConsentProvider>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
