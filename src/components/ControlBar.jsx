import React from 'react';
import { useBookmarks } from '../context/BookmarkContext';
import { LayoutList, Users, Tags, ArrowUpDown, Bookmark, Heart, Layers } from 'lucide-react';

export function ControlBar() {
  const {
    viewMode,
    setViewMode,
    sortOrder,
    setSortOrder,
    feedSource,
    setFeedSource,
    posts,
    rawPostsCount,
    savedBookmarksCount,
    likedPostsCount
  } = useBookmarks();

  return (
    <div className="control-bar-wrapper">
      {/* Top Row: Feed Source Switcher (Saved Bookmarks vs Liked Posts vs Both) */}
      <div className="feed-source-bar">
        <span className="source-bar-label">Source Feed:</span>
        <div className="source-pill-group">
          <button
            className={`source-pill ${feedSource === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setFeedSource('bookmarks')}
            title="Display posts saved as bookmarks"
          >
            <Bookmark size={15} />
            <span>Saved Bookmarks</span>
            <span className="pill-count">{savedBookmarksCount}</span>
          </button>

          <button
            className={`source-pill ${feedSource === 'likes' ? 'active' : ''}`}
            onClick={() => setFeedSource('likes')}
            title="Display posts you have liked"
          >
            <Heart size={15} />
            <span>Liked Posts</span>
            <span className="pill-count">{likedPostsCount}</span>
          </button>

          <button
            className={`source-pill ${feedSource === 'all' ? 'active' : ''}`}
            onClick={() => setFeedSource('all')}
            title="Display both saved bookmarks and liked posts"
          >
            <Layers size={15} />
            <span>All (Saved & Liked)</span>
            <span className="pill-count">{savedBookmarksCount + likedPostsCount}</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: View Mode Tabs & Sorting Controls */}
      <div className="control-bar">
        {/* Left: View Mode Toggle Tabs */}
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
            title="Display posts in a flat continuous feed"
          >
            <LayoutList size={16} />
            <span>Feed View</span>
          </button>

          <button
            className={`view-tab ${viewMode === 'author' ? 'active' : ''}`}
            onClick={() => setViewMode('author')}
            title="Group posts by author handle"
          >
            <Users size={16} />
            <span>Group by Author</span>
          </button>

          <button
            className={`view-tab ${viewMode === 'topic' ? 'active' : ''}`}
            onClick={() => setViewMode('topic')}
            title="Group posts by topic category and custom tags"
          >
            <Tags size={16} />
            <span>Group by Topic</span>
          </button>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="control-right-group">
          <span className="results-counter">
            Showing <strong>{posts.length}</strong> of <strong>{rawPostsCount}</strong> posts
          </span>

          <div className="sort-selector-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-dropdown"
            >
              <option value="newest">⏱️ Newest First (Reverse Chrono)</option>
              <option value="oldest">⏳ Oldest First (Chronological)</option>
              <option value="author">🔤 Author (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
