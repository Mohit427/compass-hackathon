import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';

function App() {
  const [view, setView] = useState('landing');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('landing')} theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (view === 'how-it-works') {
    return (
      <HowItWorks
        onBack={() => setView('landing')}
        onTryDashboard={() => setView('dashboard')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Landing
      onTryDashboard={() => setView('dashboard')}
      onHowItWorks={() => setView('how-it-works')}
    />
  );
}

export default App;
