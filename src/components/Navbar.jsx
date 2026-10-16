import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Users, LayoutDashboard, Home, Settings, LogIn, LogOut, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/teams', label: 'Teams', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/statistics', label: 'Stats', icon: BarChart2 },
    { path: '/management', label: 'Management', icon: Settings },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <div className="logo-icon">
            <Trophy size={20} fill="currentColor" />
          </div>
          <span className="logo-text">BLOOD BOWL</span>
        </div>

        <div className="nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="nav-pill"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                  <link.icon size={18} className="nav-icon" />
                  <span className="nav-label">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {currentUser ? (
            <button
              onClick={logout}
              className="nav-item"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <LogOut size={18} className="nav-icon" />
              <span className="nav-label">Logout</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="nav-pill"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                  <LogIn size={18} className="nav-icon" />
                  <span className="nav-label">Login</span>
                </>
              )}
            </NavLink>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar {
          height: 80px;
          display: flex;
          align-items: center;
          padding: 0 2rem;
          background-color: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .logo-icon {
          background-color: var(--color-primary);
          padding: 0.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: 0.05em;
        }
        .nav-links {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          color: var(--color-text-muted);
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 9999px;
          z-index: 1;
        }
        .nav-item.active {
          color: white;
        }
        .nav-pill {
          position: absolute;
          inset: 0;
          background-color: var(--color-primary);
          border-radius: 9999px;
          z-index: -1;
        }
        .nav-icon {
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .nav-label {
            display: none;
          }
          .nav-item {
            padding: 0.6rem;
          }
        }
      `}} />
    </nav>
  );
};

export default Navbar;
