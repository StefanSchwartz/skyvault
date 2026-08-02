import React, { useState } from 'react';
import { BookmarkProvider, useBookmarks } from './context/BookmarkContext';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { SearchBar } from './components/SearchBar';
import { ControlBar } from './components/ControlBar';
import { PostCard } from './components/PostCard';
import { AuthorGroup } from './components/AuthorGroup';
import { TopicGroup } from './components/TopicGroup';
import { TagEditorModal } from './components/TagEditorModal';
import { groupPostsByAuthor, groupPostsByTopic } from './services/topicEngine';
import { Bookmark, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

function AppContent() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const {
    posts,
    rawPostsCount,
    session,
    viewMode,
    isFetching,
    authError,
    toastMessage,
    customTags,
    enableDemoMode
  } = useBookmarks();

  // Compute author & topic groups if in grouped view
  const authorGroups = viewMode === 'author' ? groupPostsByAuthor(posts) : [];
  const topicGroups = viewMode === 'topic' ? groupPostsByTopic(posts, customTags) : [];

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-container">
          {/* Search & Filter Bar */}
          <SearchBar />

          {/* Controls Bar (View Mode & Sorting) */}
          <ControlBar />

          {/* Loading Indicator */}
          {isFetching && (
            <div className="loading-state-banner">
              <Loader2 size={24} className="spin-icon" />
              <span>Fetching saved posts from Bluesky PDS...</span>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="error-state-banner">
              <AlertCircle size={20} />
              <span>{authError}</span>
            </div>
          )}

          {/* View Renderers */}
          {!isFetching && posts.length > 0 && (
            <>
              {/* Flat Feed View */}
              {viewMode === 'feed' && (
                <div className="posts-feed-grid">
                  {posts.map(post => (
                    <PostCard key={post.uri} post={post} />
                  ))}
                </div>
              )}

              {/* Grouped by Author View */}
              {viewMode === 'author' && (
                <div className="grouped-views-container">
                  {authorGroups.map(group => (
                    <AuthorGroup key={group.author?.handle || 'unknown'} group={group} />
                  ))}
                </div>
              )}

              {/* Grouped by Topic View */}
              {viewMode === 'topic' && (
                <div className="grouped-views-container">
                  {topicGroups.map(group => (
                    <TopicGroup key={group.id} group={group} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty State when zero saved posts found or search yields no results */}
          {!isFetching && posts.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-icon-circle">
                <Bookmark size={36} />
              </div>
              <h3>No Saved Posts Found</h3>
              <p>
                {rawPostsCount > 0
                  ? 'No posts matched your current search query or filter filters. Try clearing search filters.'
                  : session
                  ? 'You do not have any saved posts on your Bluesky account yet. Save some posts in the Bluesky app and click Refresh!'
                  : 'Connect your Bluesky account using your handle and App Password, or try Demo Mode to preview sample saved posts!'}
              </p>
              {!session && (
                <div className="empty-actions">
                  <button className="btn-primary" onClick={() => setIsLoginOpen(true)}>
                    Connect Bluesky Account
                  </button>
                  <button className="btn-secondary" onClick={enableDemoMode}>
                    <Sparkles size={16} /> Try Demo Mode
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Overlays */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <TagEditorModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BookmarkProvider>
      <AppContent />
    </BookmarkProvider>
  );
}
