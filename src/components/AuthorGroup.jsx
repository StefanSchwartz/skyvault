import React, { useState } from 'react';
import { PostCard } from './PostCard';
import { ChevronDown, ChevronRight, User } from 'lucide-react';

export function AuthorGroup({ group }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { author, posts } = group;

  return (
    <section className="group-section author-group-section">
      <header
        className="group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="group-header-left">
          <button className="collapse-toggle-btn">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <img
            src={author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={author?.handle}
            className="group-author-avatar"
          />

          <div className="group-author-meta">
            <h3 className="group-title">{author?.displayName || author?.handle}</h3>
            <span className="group-handle">@{author?.handle}</span>
          </div>
        </div>

        <div className="group-header-right">
          <span className="group-badge">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
        </div>
      </header>

      {isExpanded && (
        <div className="group-posts-container">
          {posts.map(post => (
            <PostCard key={post.uri} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
