import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>EasyAI Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h2>Dashboard</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>API Calls</h3>
              <p className="stat-number">0</p>
            </div>
            <div className="stat-card">
              <h3>Active Keys</h3>
              <p className="stat-number">1</p>
            </div>
            <div className="stat-card">
              <h3>Usage</h3>
              <p className="stat-number">0%</p>
            </div>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>API Keys</h3>
              <p>Manage your API keys</p>
              <button className="feature-button">View Keys</button>
            </div>
            <div className="feature-card">
              <h3>Analytics</h3>
              <p>View usage analytics</p>
              <button className="feature-button">View Analytics</button>
            </div>
            <div className="feature-card">
              <h3>Settings</h3>
              <p>Configure your account</p>
              <button className="feature-button">Settings</button>
            </div>
            <div className="feature-card">
              <h3>Prompts</h3>
              <p>Manage your prompts</p>
              <button className="feature-button">View Prompts</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;