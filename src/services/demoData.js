/**
 * Rich realistic sample Bluesky posts for Demo Mode
 */
export const DEMO_POSTS = [
  {
    uri: 'at://did:plc:demo1/app.bsky.feed.post/1001',
    cid: 'bafyreidemo1',
    savedAt: '2026-08-01T12:30:00.000Z',
    recordType: 'bookmark',
    author: {
      did: 'did:plc:demo1',
      handle: 'alice.bsky.social',
      displayName: 'Alice Chen',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:demo1/avatar.jpg'
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: 'Just open-sourced our new React & TypeScript UI component library for AT Protocol apps! 🚀 Check out the docs and repository on #github: https://github.com/atproto/ui-kit',
      createdAt: '2026-08-01T12:00:00.000Z',
      facets: [
        {
          index: { byteStart: 77, byteEnd: 84 },
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'github' }]
        },
        {
          index: { byteStart: 86, byteEnd: 122 },
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://github.com/atproto/ui-kit' }]
        }
      ]
    },
    embed: {
      $type: 'app.bsky.embed.external#view',
      external: {
        uri: 'https://github.com/atproto/ui-kit',
        title: 'atproto/ui-kit: Modular React UI primitives for Bluesky',
        description: 'Modern, accessible UI primitives tailored for AT Protocol ecosystem development.',
        thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
      }
    },
    replyCount: 14,
    repostCount: 42,
    likeCount: 189
  },
  {
    uri: 'at://did:plc:demo5/app.bsky.feed.post/1005',
    cid: 'bafyreidemo5',
    savedAt: '2026-07-31T10:00:00.000Z',
    recordType: 'bookmark',
    author: {
      did: 'did:plc:demo5',
      handle: 'david.tech.bsky.social',
      displayName: 'David K. ⚡',
      avatar: null // Tests fallback avatar badge
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: 'This insight from @sarah.bsky.social on software architecture is spot on. Worth bookmarking for team discussions! 🎯',
      createdAt: '2026-07-31T09:45:00.000Z'
    },
    embed: {
      $type: 'app.bsky.embed.record#view',
      record: {
        uri: 'at://did:plc:demo4/app.bsky.feed.post/1004',
        cid: 'bafyreidemo4'
      }
    },
    quotedPost: {
      uri: 'at://did:plc:demo4/app.bsky.feed.post/1004',
      cid: 'bafyreidemo4',
      author: {
        did: 'did:plc:demo4',
        handle: 'dev.sarah.bsky.social',
        displayName: 'Sarah Miller',
        avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:demo4/avatar.jpg'
      },
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Reminder for software developers: Good architecture is not about anticipating every future feature, but about making changes easy and low-risk when requirements evolve. #software #dev',
        createdAt: '2026-07-25T14:00:00.000Z'
      }
    },
    replyCount: 8,
    repostCount: 22,
    likeCount: 94
  },
  {
    uri: 'at://did:plc:demo2/app.bsky.feed.post/1002',
    cid: 'bafyreidemo2',
    savedAt: '2026-07-30T18:15:00.000Z',
    recordType: 'like',
    author: {
      did: 'did:plc:demo2',
      handle: 'marcus.art.bsky.social',
      displayName: 'Marcus Vance 🎨',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:demo2/avatar.jpg'
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: 'Finished my latest digital illustration for the sci-fi concept book! Created in Blender + Photoshop. #art #illustration #conceptart',
      createdAt: '2026-07-30T17:45:00.000Z',
      facets: [
        { index: { byteStart: 95, byteEnd: 99 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'art' }] },
        { index: { byteStart: 100, byteEnd: 113 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'illustration' }] },
        { index: { byteStart: 114, byteEnd: 125 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'conceptart' }] }
      ]
    },
    embed: {
      $type: 'app.bsky.embed.images#view',
      images: [
        {
          fullsize: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
          thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          alt: 'Sci-fi futuristic city illustration with neon highlights'
        }
      ]
    },
    replyCount: 28,
    repostCount: 112,
    likeCount: 450
  },
  {
    uri: 'at://did:plc:demo3/app.bsky.feed.post/1003',
    cid: 'bafyreidemo3',
    savedAt: '2026-07-28T09:10:00.000Z',
    recordType: 'bookmark',
    author: {
      did: 'did:plc:demo3',
      handle: 'astronomy.now',
      displayName: 'Deep Space Daily 🔭',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:demo3/avatar.jpg'
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: 'New high-resolution imagery captured by James Webb Telescope reveals breathtaking details inside the Carina Nebula star-forming region. #space #astronomy #science',
      createdAt: '2026-07-28T08:30:00.000Z',
      facets: [
        { index: { byteStart: 139, byteEnd: 145 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'space' }] },
        { index: { byteStart: 146, byteEnd: 156 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'astronomy' }] },
        { index: { byteStart: 157, byteEnd: 165 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'science' }] }
      ]
    },
    embed: {
      $type: 'app.bsky.embed.images#view',
      images: [
        {
          fullsize: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1000&auto=format&fit=crop&q=80',
          thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80',
          alt: 'Deep space cosmic nebula filled with glowing stellar nurseries'
        }
      ]
    },
    replyCount: 64,
    repostCount: 380,
    likeCount: 1240
  }
];

export const DEMO_CUSTOM_TAGS = {
  'at://did:plc:demo1/app.bsky.feed.post/1001': ['favorites', 'must-read'],
  'at://did:plc:demo5/app.bsky.feed.post/1005': ['architecture'],
  'at://did:plc:demo2/app.bsky.feed.post/1002': ['inspiration']
};
