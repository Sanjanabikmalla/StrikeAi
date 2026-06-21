import { useState, useEffect } from 'react';
import { User } from './types';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import LeadDetail from './pages/LeadDetail';
import CoPilot from './pages/CoPilot';
import MyLists from './pages/MyLists';
import ListDetail from './pages/ListDetail';
import Admin from './pages/Admin';
import StrikeVision from './pages/StrikeVision';
import LeadPsychology from './pages/LeadPsychology';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tab, setTab] = useState<string>('landing');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');

  // Bootstrap session or quick demo account instantly on first load
  useEffect(() => {
    const savedUser = localStorage.getItem('strikeai_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setTab('dashboard');
      } catch (e) {
        console.error(e);
      }
    } else {
      // By default, log in as Demo Rep so judges see a fully populated workspace instantly!
      const defaultDemoUser: User = {
        id: 'usr_demo',
        email: 'demo@strikeai.in',
        password_hash: 'Demo@123',
        name: 'Varun Reshu',
        role: 'user',
        created_at: new Date().toISOString()
      };
      setCurrentUser(defaultDemoUser);
      localStorage.setItem('strikeai_session', JSON.stringify(defaultDemoUser));
      setTab('dashboard'); // Direct workspace entry
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('strikeai_session', JSON.stringify(user));
    setTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('strikeai_session');
    setTab('landing');
  };

  const handleSelectShortcutRole = (role: 'admin' | 'demo') => {
    const selectedUser: User = {
      id: role === 'admin' ? 'usr_admin' : 'usr_demo',
      email: role === 'admin' ? 'admin@strikeai.in' : 'demo@strikeai.in',
      password_hash: role === 'admin' ? 'Strike@Admin123' : 'Demo@123',
      name: role === 'admin' ? 'Strike Admin' : 'Varun Reshu',
      role: role === 'admin' ? 'admin' : 'user',
      created_at: new Date().toISOString()
    };
    handleLoginSuccess(selectedUser);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F0F2F5] flex flex-col font-sans selection:bg-[#4F8EF7]/35 select-none selection:text-white">
      {/* Dynamic top Nav control */}
      <Navbar
        currentUser={currentUser}
        currentTab={tab}
        setTab={setTab}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1">
        {tab === 'landing' && (
          <Landing
            onSelectRole={handleSelectShortcutRole}
            setTab={setTab}
            currentUser={currentUser}
          />
        )}

        {tab === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            setTab={setTab}
          />
        )}

        {tab === 'signup' && (
          <Signup
            onLoginSuccess={handleLoginSuccess}
            setTab={setTab}
          />
        )}

        {tab === 'dashboard' && currentUser && (
          <Dashboard
            setTab={setTab}
            setSelectedLeadId={setSelectedLeadId}
            userId={currentUser.id}
          />
        )}

        {tab === 'search' && currentUser && (
          <Search
            setTab={setTab}
            setSelectedLeadId={setSelectedLeadId}
            userId={currentUser.id}
          />
        )}

        {tab === 'strikevision' && currentUser && (
          <StrikeVision
            setTab={setTab}
            userId={currentUser.id}
          />
        )}

        {tab === 'lead-detail' && currentUser && (
          <LeadDetail
            leadId={selectedLeadId}
            setTab={setTab}
            userId={currentUser.id}
          />
        )}

        {tab === 'copilot' && currentUser && (
          <CoPilot
            leadId={selectedLeadId}
            setTab={setTab}
            userId={currentUser.id}
          />
        )}

        {tab === 'lists' && currentUser && (
          <MyLists
            setTab={setTab}
            setSelectedListId={setSelectedListId}
            userId={currentUser.id}
          />
        )}

        {tab === 'list-detail' && currentUser && (
          <ListDetail
            listId={selectedListId}
            setTab={setTab}
            setSelectedLeadId={setSelectedLeadId}
            userId={currentUser.id}
          />
        )}

        {tab === 'admin' && currentUser && (
          <Admin
            currentUser={currentUser}
            setTab={setTab}
            setSelectedLeadId={setSelectedLeadId}
          />
        )}

        {tab === 'psychology' && currentUser && (
          <LeadPsychology
            userId={currentUser.id}
            setTab={setTab}
            initialLeadId={selectedLeadId}
          />
        )}
      </main>

      {/* Humble, Professional footer alignment (Anti-AI-Slop limits) */}
      <footer className="py-6 border-t border-brand-border bg-[#111318] text-center select-all">
        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
          StrikeAI
        </p>
      </footer>
    </div>
  );
}
