import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomeView from './views/HomeView';
import TeamsView from './views/TeamsView';
import TeamDetailView from './views/TeamDetailView';
import LeaderboardView from './views/LeaderboardView';
import ManagementView from './views/ManagementView';
import Login from './components/Login';
import Signup from './components/Signup';
import StatisticsView from './views/StatisticsView';
import { TournamentProvider } from './context/TournamentContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <Router>
          <div className="app-layout">
            <Navbar />
            <main className="content">
              <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/teams" element={<TeamsView />} />
                <Route path="/teams/:id" element={<TeamDetailView />} />
                <Route path="/leaderboard" element={<LeaderboardView />} />
                <Route path="/statistics" element={<StatisticsView />} />
                <Route path="/management" element={<ManagementView />} />
              </Routes>
            </main>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            .app-layout {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .content {
              flex: 1;
              width: 100%;
              max-width: 1400px;
              margin: 0 auto;
            }
          `}} />
        </Router>
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
