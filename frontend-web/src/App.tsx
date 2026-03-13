import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { I18nProvider } from './i18n/I18nProvider';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LoadingProvider } from './providers/LoadingProvider';


function App() {
  return (
    <I18nProvider>
      <LoadingProvider>
        <Router>
          <LanguageSwitcher />
          <AppRoutes />
        </Router>
      </LoadingProvider>
    </I18nProvider>
  );
}

export default App;
