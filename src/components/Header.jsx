import React, { useState } from 'react';
import { useBookmarks } from '../context/BookmarkContext';
import { Cloud, LogIn, LogOut, RefreshCw, Sparkles, User as UserIcon } from 'lucide-react';

export function Header({ onOpenLogin }) {
  const { session, handleLogout, enableDemoMode, refreshPosts, isFetching } = useBookmarks();
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo & Name */}
        <div className="brand-logo-group">
          <div className="logo-icon-wrapper">
            <Cloud size={24} className="logo-cloud-icon" />
          </div>
          <div>
            <h1 className="brand-title">SkyVault</h1>
            <p className="brand-subtitle">Bluesky Saved & Liked Posts Manager</p>
          </div>
        </div>

        {/* Right Actions / Profile Status */}
        <div className="header-actions">
          {session ? (
            <div className="user-profile-badge">
              {session.avatar && !avatarFailed ? (
                <img
                  src={session.avatar}
                  alt={session.handle}
                  className="user-avatar"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="user-avatar-fallback">
                  <UserIcon size={18} />
                </div>
              )}
              <div className="user-text-info">
                <span className="user-display-name">{session.displayName || session.handle}</span>
                <span className="user-handle">@{session.handle}</span>
              </div>
              
              <button
                className="header-icon-btn"
                onClick={refreshPosts}
                disabled={isFetching}
                title="Refresh saved and liked posts"
              >
                <RefreshCw size={18} className={isFetching ? 'spin-icon' : ''} />
              </button>

              <button
                className="header-logout-btn"
                onClick={handleLogout}
                title="Sign out of session"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="guest-actions">
              <button
                className="demo-mode-btn"
                onClick={enableDemoMode}
                title="Preview app with sample posts"
              >
                <Sparkles size={16} /> Try Demo
              </button>

              <button
                className="header-login-btn"
                onClick={onOpenLogin}
              >
                <LogIn size={16} /> Connect Bluesky
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
