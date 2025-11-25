// test_feed.js

// ============================================================
// 1. SIDEBAR & NAVIGATION
// ============================================================
const sidebar = document.getElementById('sidebar');
if (sidebar) {
  sidebar.addEventListener('mouseenter', () => sidebar.classList.add('expanded'));
  sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('expanded'));
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // In a real app, clear tokens here
    window.location.href = 'index.html';
  });
}
const logoutTop = document.getElementById('logoutTop');
if (logoutTop) {
  logoutTop.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Navigation Links
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const label = btn.querySelector('.label').innerText.trim();
    if (label === 'Create Post') window.location.href = 'post.html';
    if (label === 'Home') window.location.href = 'test_feed.html';
    if (label === 'Profile') window.location.href = 'profile.html';
    // Add other links as needed
  });
});

// Compose Box Redirect
const composeBox = document.getElementById('composeBox');
if (composeBox) {
  composeBox.addEventListener('click', () => window.location.href = 'post.html');
}


// ============================================================
// 2. CAROUSEL LOGIC
// ============================================================
class Carousel {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector('.slides');
    if (!this.track) this.track = root.querySelector('.media-track'); // Fallback

    this.dotsWrap = root.querySelector('.dots');
    this.slides = [];
    this.index = 0;
    this.audioEl = null;

    // Parse data-media attribute
    const mediaData = JSON.parse(root.getAttribute('data-media') || '[]');
    mediaData.forEach(item => this.addSlide(item));

    this.render();
    this.addListeners();
  }

  addSlide(item) {
    const src = typeof item === 'string' ? item : item.url;
    const type = typeof item === 'string' ? 'image' : (item.content_type || 'image');

    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.minWidth = '100%';
    slide.style.height = '100%';
    slide.style.display = 'flex';
    slide.style.alignItems = 'center';
    slide.style.justifyContent = 'center';

    if (/\.(mp4|webm|ogg)$/i.test(src) || type.startsWith('video')) {
      const v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = 'cover';
      slide.appendChild(v);
    } else if (/\.(mp3|wav|m4a)$/i.test(src) || type.startsWith('audio')) {
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '260px';
      placeholder.style.display = 'grid';
      placeholder.style.placeItems = 'center';
      placeholder.innerText = 'Audio track';
      slide.appendChild(placeholder);

      if (!this.audioEl) {
        this.audioEl = document.createElement('audio');
        this.audioEl.src = src;
        this.audioEl.preload = 'auto';
      }
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'post media';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      slide.appendChild(img);
    }
    this.slides.push(slide);
  }

  render() {
    this.track.innerHTML = '';
    this.dotsWrap.innerHTML = '';

    if (this.slides.length === 0) return;

    this.slides.forEach((s, i) => {
      this.track.appendChild(s);

      if (this.slides.length > 1) {
        const d = document.createElement('button');
        d.className = 'dot';
        d.dataset.index = i;
        d.addEventListener('click', (e) => {
          e.stopPropagation();
          this.go(i);
        });
        this.dotsWrap.appendChild(d);
      }
    });
    this.update();
  }

  update() {
    if (this.slides.length === 0) return;
    this.track.style.transform = `translateX(-${this.index * 100}%)`;

    Array.from(this.dotsWrap.children).forEach((b, i) => {
      b.classList.toggle('active', i === this.index);
    });
  }

  go(i) {
    this.index = Math.max(0, Math.min(i, this.slides.length - 1));
    this.update();
  }

  next() { this.go(this.index + 1); }
  prev() { this.go(this.index - 1); }

  addListeners() {
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });

    let startX = null;
    this.track.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      this.track.setPointerCapture(e.pointerId);
    });
    this.track.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (dx < -30) this.next();
      if (dx > 30) this.prev();
      startX = null;
    });
  }
}


// ============================================================
// 3. FEED LOGIC
// ============================================================

async function loadFeed() {
  const feedContainer = document.getElementById('feed');
  if (!feedContainer) return;

  // Clear existing content except template
  const template = document.querySelector('.post-card.template');
  feedContainer.innerHTML = '';
  if (template) feedContainer.appendChild(template);

  // Fetch posts
  let posts = [];
  try {
    const res = await fetch('http://localhost:8000/posts');
    if (res.ok) {
      posts = await res.json();
    } else {
      console.error("Failed to fetch posts");
      return;
    }
  } catch (e) {
    console.error("Error fetching posts:", e);
    return;
  }

  if (posts.length === 0) {
    const msg = document.createElement('div');
    msg.style.padding = '20px';
    msg.style.textAlign = 'center';
    msg.style.color = '#888';
    msg.innerText = 'No posts yet. Be the first to post!';
    feedContainer.appendChild(msg);
    return;
  }

  if (!template) {
    console.error("Post template not found!");
    return;
  }

  posts.forEach(p => {
    const card = template.cloneNode(true);
    card.classList.remove('template');
    card.hidden = false;

    // Set ID
    card.dataset.id = p._id;

    // Meta Info
    const authorName = p.author || "--username";
    card.querySelector('.author').textContent = authorName;
    card.querySelector('.avatar').textContent = getInitials(authorName);
    card.querySelector('.time').textContent = timeAgo(p.created_at);

    // Caption & Details
    let contentHtml = `<strong>${escapeHtml(p.caption || "")}</strong>`;
    if (p.description) contentHtml += `<br><span style="font-size:0.9em; color:#dbeeff;">${escapeHtml(p.description)}</span>`;
    if (p.feeling) contentHtml += `<br><em style="color:#aaa">Feeling ${escapeHtml(p.feeling)}</em>`;
    if (p.location) contentHtml += ` <span style="color:#aaa">📍 ${escapeHtml(p.location)}</span>`;

    card.querySelector('.post-text').innerHTML = contentHtml;

    // Media
    const mediaCarousel = card.querySelector('.media-carousel');
    if (p.media && p.media.length > 0) {
      mediaCarousel.setAttribute('data-media', JSON.stringify(p.media));
    } else {
      mediaCarousel.style.display = 'none';
    }

    // Menu Actions
    setupPostMenu(card, p._id);

    // Reaction Buttons
    // Pass likes/comments count safely
    const likesCount = Array.isArray(p.likes) ? p.likes.length : 0;
    const commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;
    setupReactions(card, p._id, likesCount, commentsCount);

    feedContainer.appendChild(card);

    // Initialize Carousel if media exists
    if (p.media && p.media.length > 0) {
      new Carousel(mediaCarousel);
    }
  });
}

// Helper: Setup Menu
function setupPostMenu(card, postId) {
  const menuBtn = card.querySelector('.menu-btn');
  const dropdown = card.querySelector('.menu-dropdown');

  if (!menuBtn || !dropdown) return;

  dropdown.hidden = true;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasHidden = dropdown.hidden;
    document.querySelectorAll('.menu-dropdown').forEach(el => el.hidden = true);
    dropdown.hidden = !wasHidden;
  });

  dropdown.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      dropdown.hidden = true;

      if (action === 'repost') {
        alert(`Reposting post ${postId}...`);
      } else if (action === 'not-interested') {
        alert(`Marked not interested: ${postId}`);
        card.remove();
      } else if (action === 'fav') {
        alert(`Added to favourites: ${postId}`);
      } else if (action === 'share') {
        sharePost(postId);
      } else if (action === 'edit') {
        window.location.href = `post.html?id=${postId}`;
      }
    });
  });
}

// Helper: Setup Reactions
function setupReactions(card, postId, initialLikes, initialComments) {
  const likeBtn = card.querySelector('.like-btn');
  const commentBtn = card.querySelector('.comment-btn');
  const repostBtn = card.querySelector('.repost-btn');
  const shareBtn = card.querySelector('.share-btn');

  const likeCount = card.querySelector('.count-like');
  const commentCount = card.querySelector('.count-comment');

  if (likeCount) likeCount.textContent = initialLikes;
  if (commentCount) commentCount.textContent = initialComments;

  // LIKE LOGIC
  if (likeBtn) {
    // 1. Click on Heart Icon -> Toggle Like
    likeBtn.addEventListener('click', async (e) => {
      // If clicked on the span (count), ignore here (handled below)
      if (e.target.classList.contains('count-like') || e.target.tagName === 'SPAN') {
        // If user clicked specifically on the text/count span, do nothing here
        // The separate listener below will handle it.
        // However, if the button structure is <button>Icon <span>Text</span></button>, 
        // we need to be careful. 
        // User requirement: "clicking the text 'like' the list of likes is fetched"
        // "clicking the like emoji, a like count is increased"

        // Let's check what was clicked.
        const text = e.target.textContent.trim();
        // If the click target is the count span, return.
        if (e.target.classList.contains('count-like')) return;

        // If the click target is the "Like" text span (if it exists separately), return.
        // Based on HTML: <button>❤️ <span>Like</span> <span class="count-like">0</span></button>
        if (e.target.tagName === 'SPAN' && e.target.innerText === 'Like') return;
      }

      e.stopPropagation();

      // Toggle Like Logic
      try {
        const CURRENT_USER = localStorage.getItem('username') || "Guest";
        const res = await fetch(`http://localhost:8000/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: CURRENT_USER })
        });

        if (res.ok) {
          const data = await res.json();
          let current = parseInt(likeCount.textContent || '0');
          if (data.liked) {
            likeCount.textContent = current + 1;
          } else {
            likeCount.textContent = Math.max(0, current - 1);
          }
        }
      } catch (e) {
        console.error("Error liking post:", e);
      }
    });

    // 2. Click on Count or "Like" Text -> Open Likes Modal
    // We attach listener to the button but filter for the spans, OR attach to spans directly.
    // Attaching to spans is safer.
    const likeTextSpan = likeBtn.querySelector('span:not(.count-like)');

    if (likeCount) {
      likeCount.addEventListener('click', (e) => {
        e.stopPropagation();
        openLikesModal(postId);
      });
    }
    if (likeTextSpan) {
      likeTextSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        openLikesModal(postId);
      });
    }
  }

  // COMMENT LOGIC
  if (commentBtn) {
    commentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommentsModal(postId);
    });
  }

  // REPOST LOGIC
  if (repostBtn) {
    repostBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      alert(`Reposting post ${postId}...`);
    });
  }

  // SHARE LOGIC
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sharePost(postId);
    });
  }
}

// Helper: Share
async function sharePost(postId) {
  const shareUrl = window.location.origin + '/post.html?id=' + encodeURIComponent(postId);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Check this post', url: shareUrl });
    } catch (e) {
      console.log('Share cancelled');
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Post link copied to clipboard');
    } catch (e) {
      alert('Could not copy link');
    }
  }
}

// Helper: Initials
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// Helper: Time Ago
function timeAgo(iso) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Close dropdowns on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-btn') && !e.target.closest('.menu-dropdown')) {
    document.querySelectorAll('.menu-dropdown:not([hidden])').forEach(el => el.hidden = true);
  }
});


// ============================================================
// 4. MODAL LOGIC (BACKEND INTEGRATED)
// ============================================================
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const modalClose = document.getElementById('modalClose');
const commentInput = document.getElementById('commentInput');
const sendCommentBtn = document.getElementById('sendCommentBtn');

// Get username from localStorage or default to "Guest"
const CURRENT_USER = localStorage.getItem('username') || "Guest";
let currentPostIdForModal = null;

// Update UI with username
const topbarUsername = document.querySelector('.topbar .username');
if (topbarUsername) {
  topbarUsername.textContent = `@${CURRENT_USER} • vibing`;
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

function openModal(title) {
  if (!modalOverlay) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:#888">Loading...</div>';
  modalFooter.hidden = true;
  modalOverlay.classList.add('active');
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('active');
  currentPostIdForModal = null;
}

// OPEN LIKES MODAL (FETCH FROM DB)
async function openLikesModal(postId) {
  openModal("Likes");

  try {
    const res = await fetch(`http://localhost:8000/posts/${postId}/likes`);
    if (res.ok) {
      const users = await res.json();
      modalBody.innerHTML = '';

      if (users.length === 0) {
        modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:#888">No likes yet.</div>';
        return;
      }

      users.forEach(u => {
        const row = document.createElement('div');
        row.className = 'user-row';
        const initials = getInitials(u.username);
        row.innerHTML = `
          <div class="avatar">${initials}</div>
          <div class="name">${escapeHtml(u.username)}</div>
        `;
        modalBody.appendChild(row);
      });
    } else {
      modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:red">Failed to load likes.</div>';
    }
  } catch (e) {
    console.error(e);
    modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:red">Error loading likes.</div>';
  }
}

// OPEN COMMENTS MODAL (FETCH FROM DB)
async function openCommentsModal(postId) {
  currentPostIdForModal = postId;
  openModal("Comments");
  modalFooter.hidden = false; // Show input

  try {
    const res = await fetch(`http://localhost:8000/posts/${postId}/comments`);
    if (res.ok) {
      const comments = await res.json();
      modalBody.innerHTML = '';

      if (comments.length === 0) {
        modalBody.innerHTML = '<div style="padding:20px; color:#888; text-align:center">No comments yet. Be the first!</div>';
      } else {
        comments.forEach(c => renderCommentRow(c));
      }
    } else {
      modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:red">Failed to load comments.</div>';
    }
  } catch (e) {
    console.error(e);
    modalBody.innerHTML = '<div style="padding:20px; text-align:center; color:red">Error loading comments.</div>';
  }
}

function renderCommentRow(c) {
  const row = document.createElement('div');
  row.className = 'comment-row';
  const user = c.username || "Anonymous";
  const initials = getInitials(user);

  row.innerHTML = `
    <div class="comment-header">
      <div class="avatar" style="width:24px; height:24px; font-size:10px;">${initials}</div>
      <div class="name" style="font-size:14px;">${escapeHtml(user)}</div>
    </div>
    <div class="comment-text">${escapeHtml(c.text)}</div>
  `;
  modalBody.appendChild(row);
}

// HANDLE COMMENT SUBMIT (POST TO DB)
if (sendCommentBtn) {
  sendCommentBtn.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text || !currentPostIdForModal) return;

    // Optimistic UI update
    if (modalBody.innerText.includes("No comments")) modalBody.innerHTML = '';

    try {
      const res = await fetch(`http://localhost:8000/posts/${currentPostIdForModal}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: CURRENT_USER, text: text })
      });

      if (res.ok) {
        const data = await res.json();
        renderCommentRow(data.comment);
        commentInput.value = '';

        // Update comment count in background
        const card = document.querySelector(`.post-card[data-id="${currentPostIdForModal}"]`);
        if (card) {
          const countSpan = card.querySelector('.count-comment');
          if (countSpan) {
            let current = parseInt(countSpan.textContent || '0');
            countSpan.textContent = current + 1;
          }
        }
      } else {
        alert("Failed to post comment");
      }
    } catch (e) {
      console.error(e);
      alert("Error posting comment");
    }
  });
}

// ============================================================
// 5. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadFeed();
});
