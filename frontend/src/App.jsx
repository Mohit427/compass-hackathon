import { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';

function App() {
  const [view, setView] = useState('landing');

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('landing')} />;
  }

  if (view === 'how-it-works') {
    return <HowItWorks onBack={() => setView('landing')} onTryDashboard={() => setView('dashboard')} />;
  }

  return (
    <Landing
      onTryDashboard={() => setView('dashboard')}
      onHowItWorks={() => setView('how-it-works')}
    />
  );
}

export default App;
