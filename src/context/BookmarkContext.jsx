import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loginWithAppPassword, fetchSavedPosts, fetchLikedPosts, unsavePostRecord, resumeAgentSession } from '../services/atproto';
import { loadSession, saveSession, clearSession, loadCustomTags, saveCustomTags, rememberHandle, getRememberedHandle } from '../services/storage';
import { filterAndSortPosts } from '../services/searchEngine';
import { DEMO_POSTS, DEMO_CUSTOM_TAGS } from '../services/demoData';

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const [agent, setAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Raw Posts lists
  const [savedBookmarks, setSavedBookmarks] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [customTags, setCustomTags] = useState(() => loadCustomTags());
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Feed Source Selection: 'bookmarks' | 'likes' | 'all'
  const [feedSource, setFeedSource] = useState('bookmarks');

  // Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all', 'images', 'video', 'links', 'quotes', 'text_only'
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [viewMode, setViewMode] = useState('feed'); // 'feed', 'author', 'topic'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'author'

  // Tag editor modal state
  const [tagModalPost, setTagModalPost] = useState(null);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // Session restoration on mount
  useEffect(() => {
    async function restore() {
      const storedSession = loadSession();
      if (storedSession) {
        const restoredAgent = await resumeAgentSession(storedSession);
        if (restoredAgent) {
          setAgent(restoredAgent);
          setSession(restoredAgent.session);
          loadAllPostsForAgent(restoredAgent);
        } else {
          clearSession();
        }
      }
      setIsAuthLoading(false);
    }
    restore();
  }, []);

  // Fetch both saved bookmarks AND liked posts concurrently from PDS
  const loadAllPostsForAgent = async (activeAgent) => {
    setIsFetching(true);
    setAuthError(null);
    try {
      const [bookmarksRes, likesRes] = await Promise.all([
        fetchSavedPosts(activeAgent).catch(err => {
          console.warn('Saved bookmarks fetch error:', err);
          return [];
        }),
        fetchLikedPosts(activeAgent).catch(err => {
          console.warn('Liked posts fetch error:', err);
          return [];
        })
      ]);

      setSavedBookmarks(bookmarksRes);
      setLikedPosts(likesRes);

      if (bookmarksRes.length === 0 && likesRes.length === 0) {
        showToast('No saved bookmarks or liked posts found on your account yet.');
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
      setAuthError(err.message || 'Failed to fetch posts from PDS');
      showToast('Error loading posts from Bluesky PDS');
    } finally {
      setIsFetching(false);
    }
  };

  // Login Handler
  const handleLogin = async (identifier, appPassword) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const { agent: newAgent, session: newSession } = await loginWithAppPassword(identifier, appPassword);
      setAgent(newAgent);
      setSession(newSession);
      setIsDemoMode(false);
      saveSession(newSession);
      rememberHandle(identifier);

      showToast(`Logged in as @${newSession.handle}`);
      await loadAllPostsForAgent(newAgent);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Authentication failed. Please check handle and App Password.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setAgent(null);
    setSession(null);
    setSavedBookmarks([]);
    setLikedPosts([]);
    setIsDemoMode(false);
    clearSession();
    showToast('Logged out of Bluesky session');
  };

  // Enable Demo Mode
  const enableDemoMode = () => {
    setIsDemoMode(true);
    setSession({
      handle: 'demo.user.bsky.social',
      displayName: 'Demo Viewer',
      avatar: null // Will render clean avatar badge
    });
    setSavedBookmarks(DEMO_POSTS.filter(p => p.recordType === 'bookmark'));
    setLikedPosts(DEMO_POSTS.filter(p => p.recordType === 'like'));
    setCustomTags(DEMO_CUSTOM_TAGS);
    showToast('Switched to Demo Mode with sample posts');
  };

  // Refresh saved & liked posts
  const refreshPosts = () => {
    if (isDemoMode) {
      setSavedBookmarks(DEMO_POSTS.filter(p => p.recordType === 'bookmark'));
      setLikedPosts(DEMO_POSTS.filter(p => p.recordType === 'like'));
      showToast('Refreshed demo posts');
    } else if (agent) {
      loadAllPostsForAgent(agent);
    }
  };

  // Unsave post with Optimistic UI update
  const handleUnsavePost = async (post) => {
    const isBookmark = post.recordType === 'bookmark';
    const originalBookmarks = [...savedBookmarks];
    const originalLikes = [...likedPosts];

    if (isBookmark) {
      setSavedBookmarks(prev => prev.filter(p => p.uri !== post.uri));
    } else {
      setLikedPosts(prev => prev.filter(p => p.uri !== post.uri));
    }
    showToast(isBookmark ? 'Post removed from Saved Bookmarks' : 'Post unliked');

    if (!isDemoMode && agent) {
      try {
        await unsavePostRecord(agent, post);
      } catch (err) {
        console.error('Failed to remove record on PDS:', err);
        setSavedBookmarks(originalBookmarks);
        setLikedPosts(originalLikes);
        showToast('Failed to remove record on Bluesky PDS. Reverted.', 4000);
      }
    }
  };

  // Custom Tag Editing handlers
  const addCustomTag = (postUri, newTag) => {
    const cleanTag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;

    setCustomTags(prev => {
      const current = prev[postUri] || [];
      if (current.includes(cleanTag)) return prev;
      const updated = { ...prev, [postUri]: [...current, cleanTag] };
      saveCustomTags(updated);
      return updated;
    });
    showToast(`Added tag #${cleanTag}`);
  };

  const removeCustomTag = (postUri, tagToRemove) => {
    setCustomTags(prev => {
      const current = prev[postUri] || [];
      const updatedList = current.filter(t => t !== tagToRemove);
      const updated = { ...prev, [postUri]: updatedList };
      saveCustomTags(updated);
      return updated;
    });
    showToast(`Removed tag #${tagToRemove}`);
  };

  // Combine posts based on active feedSource
  const activePostsPool = useMemo(() => {
    if (feedSource === 'bookmarks') {
      return savedBookmarks;
    } else if (feedSource === 'likes') {
      return likedPosts;
    } else {
      // 'all' - deduplicate if a post is both saved & liked
      const map = new Map();
      for (const p of [...savedBookmarks, ...likedPosts]) {
        map.set(p.uri, p);
      }
      return Array.from(map.values());
    }
  }, [feedSource, savedBookmarks, likedPosts]);

  // Processed (searched, filtered, sorted) Posts
  const processedPosts = useMemo(() => {
    return filterAndSortPosts(activePostsPool, {
      searchQuery,
      mediaFilter,
      activeTagFilter,
      sortOrder,
      customTagsMap: customTags
    });
  }, [activePostsPool, searchQuery, mediaFilter, activeTagFilter, sortOrder, customTags]);

  const value = {
    agent,
    session,
    isAuthLoading,
    isFetching,
    authError,
    toastMessage,
    posts: processedPosts,
    rawPostsCount: activePostsPool.length,
    savedBookmarksCount: savedBookmarks.length,
    likedPostsCount: likedPosts.length,
    feedSource,
    setFeedSource,
    customTags,
    isDemoMode,
    searchQuery,
    setSearchQuery,
    mediaFilter,
    setMediaFilter,
    activeTagFilter,
    setActiveTagFilter,
    viewMode,
    setViewMode,
    sortOrder,
    setSortOrder,
    tagModalPost,
    setTagModalPost,
    handleLogin,
    handleLogout,
    enableDemoMode,
    refreshPosts,
    handleUnsavePost,
    addCustomTag,
    removeCustomTag,
    getRememberedHandle
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
