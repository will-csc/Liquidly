import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { I18nProvider } from './i18n/I18nProvider';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LoadingProvider } from './providers/LoadingProvider';
import { clearPersistentAuth } from './lib/authStorage';


function App() {
  useEffect(() => {
    clearPersistentAuth();
  }, []);

  return (
    <I18nProvider>
      <Router>
        <LoadingProvider>
          <LanguageSwitcher />
          <AppRoutes />
        </LoadingProvider>
      </Router>
    </I18nProvider>
  );
}

export default App;
