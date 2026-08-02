import React, { useState } from 'react';
import { useBookmarks } from '../context/BookmarkContext';
import { KeyRound, User, ExternalLink, X, ShieldCheck } from 'lucide-react';

export function LoginModal({ isOpen, onClose }) {
  const { handleLogin, isAuthLoading, authError, getRememberedHandle } = useBookmarks();
  const [identifier, setIdentifier] = useState(() => getRememberedHandle() || '');
  const [appPassword, setAppPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !appPassword) return;
    await handleLogin(identifier, appPassword);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck size={24} className="modal-shield-icon" />
            <h2>Connect Bluesky Account</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {authError && (
            <div className="modal-error-banner">
              <p>{authError}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="identifier">Bluesky Handle or Email</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="identifier"
                type="text"
                placeholder="username.bsky.social"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="appPassword">App Password</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="appPassword"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="app-password-help-box">
            <p>
              🔒 <strong>Why App Passwords?</strong> SkyVault runs 100% in your browser. Using a Bluesky App Password keeps your main password safe and grants direct, secure access to your PDS saved posts.
            </p>
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              Generate App Password in Bluesky <ExternalLink size={13} />
            </a>
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isAuthLoading}>
              {isAuthLoading ? 'Connecting to PDS...' : 'Log In'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
