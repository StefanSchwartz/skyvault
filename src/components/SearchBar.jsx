import React from 'react';
import { useBookmarks } from '../context/BookmarkContext';
import { Search, X, Image, Video, Link, MessageCircle, FileText, Sparkles } from 'lucide-react';
import { AUTO_TOPIC_CATEGORIES } from '../services/topicEngine';

export function SearchBar() {
  const {
    searchQuery,
    setSearchQuery,
    mediaFilter,
    setMediaFilter,
    activeTagFilter,
    setActiveTagFilter,
    customTags
  } = useBookmarks();

  const mediaOptions = [
    { id: 'all', label: 'All Posts', icon: Sparkles },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'links', label: 'Links', icon: Link },
    { id: 'quotes', label: 'Quotes', icon: MessageCircle },
    { id: 'text_only', label: 'Text Only', icon: FileText }
  ];

  // Unique custom tags list across all posts
  const allCustomTags = Array.from(new Set(Object.values(customTags).flat()));

  return (
    <div className="search-bar-section">
      {/* Search Input Box */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search saved posts by text, @handle, #hashtag, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Row: Media Types & Topics */}
      <div className="filters-row">
        {/* Media Filter Chips */}
        <div className="filter-group media-filter-group">
          {mediaOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = mediaFilter === opt.id;
            return (
              <button
                key={opt.id}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                onClick={() => setMediaFilter(opt.id)}
              >
                <Icon size={14} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tag Selector */}
        <div className="filter-group tag-select-group">
          <select
            value={activeTagFilter}
            onChange={(e) => setActiveTagFilter(e.target.value)}
            className="tag-dropdown"
          >
            <option value="all">🏷️ All Topics & Tags</option>
            <optgroup label="Auto Topics">
              {Object.values(AUTO_TOPIC_CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </optgroup>
            {allCustomTags.length > 0 && (
              <optgroup label="Custom User Tags">
                {allCustomTags.map(tag => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
