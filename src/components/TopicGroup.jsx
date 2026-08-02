import React, { useState } from 'react';
import { PostCard } from './PostCard';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';

export function TopicGroup({ group }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { name, icon, color, isCustom, posts } = group;

  return (
    <section className="group-section topic-group-section">
      <header
        className="group-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderLeftColor: color || 'hsl(210, 80%, 55%)' }}
      >
        <div className="group-header-left">
          <button className="collapse-toggle-btn">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <div
            className="topic-icon-badge"
            style={{ backgroundColor: color ? `${color}20` : 'rgba(255,255,255,0.1)', color: color }}
          >
            <span>{icon || '🏷️'}</span>
          </div>

          <div className="group-topic-meta">
            <h3 className="group-title">{name}</h3>
            {isCustom && <span className="custom-tag-label">Custom User Tag</span>}
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
