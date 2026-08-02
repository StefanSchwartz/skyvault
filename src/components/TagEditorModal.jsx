import React, { useState } from 'react';
import { useBookmarks } from '../context/BookmarkContext';
import { getPostAllTopics } from '../services/topicEngine';
import { Tag, Plus, X, Sparkles } from 'lucide-react';

export function TagEditorModal() {
  const { tagModalPost, setTagModalPost, addCustomTag, removeCustomTag, customTags } = useBookmarks();
  const [newTagInput, setNewTagInput] = useState('');

  if (!tagModalPost) return null;

  const { customTags: currentCustomTags } = getPostAllTopics(tagModalPost, customTags);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    addCustomTag(tagModalPost.uri, newTagInput);
    setNewTagInput('');
  };

  const suggestedTags = ['favorites', 'must-read', 'inspiration', 'tutorial', 'reference', 'project-idea', 'funny'];

  return (
    <div className="modal-backdrop" onClick={() => setTagModalPost(null)}>
      <div className="modal-card tag-editor-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-group">
            <Tag size={22} className="modal-icon" />
            <h2>Manage Custom Tags</h2>
          </div>
          <button className="modal-close-btn" onClick={() => setTagModalPost(null)}>
            <X size={20} />
          </button>
        </header>

        <div className="tag-editor-body">
          <p className="tag-editor-subtitle">
            Add custom tags to organize this post into your personal topics and categories.
          </p>

          {/* Current Custom Tags */}
          <div className="current-tags-section">
            <label className="section-label">Active Custom Tags:</label>
            {currentCustomTags.length > 0 ? (
              <div className="tags-chip-list">
                {currentCustomTags.map(tag => (
                  <span key={tag} className="editable-tag-chip">
                    #{tag}
                    <button
                      type="button"
                      className="remove-tag-x"
                      onClick={() => removeCustomTag(tagModalPost.uri, tag)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-tags-text">No custom tags attached yet.</p>
            )}
          </div>

          {/* Add New Tag Form */}
          <form onSubmit={handleAdd} className="add-tag-form">
            <div className="input-with-btn">
              <input
                type="text"
                placeholder="Enter new tag name (e.g. read-later)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="tag-input"
              />
              <button type="submit" className="btn-primary add-btn">
                <Plus size={16} /> Add Tag
              </button>
            </div>
          </form>

          {/* Suggested Quick Tags */}
          <div className="suggested-tags-section">
            <span className="section-label"><Sparkles size={13} /> Quick Suggestions:</span>
            <div className="suggested-chips">
              {suggestedTags.map(st => (
                <button
                  key={st}
                  type="button"
                  className="suggested-chip-btn"
                  onClick={() => addCustomTag(tagModalPost.uri, st)}
                >
                  +{st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={() => setTagModalPost(null)}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
