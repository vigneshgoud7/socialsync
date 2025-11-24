// Sidebar expand/collapse logic (hover and keyboard focus)
const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('focus', () => sidebar.classList.add('expanded'));
sidebar.addEventListener('blur', () => sidebar.classList.remove('expanded'));
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('expanded'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('expanded'));

// Redirect buttons
document.getElementById('profileBtn').addEventListener('click', () => location.href = 'profile.html');
document.getElementById('createPostBtn').addEventListener('click', () => location.href = 'post.html');
document.getElementById('logoutTop').addEventListener('click', () => location.href = 'login.html');

// Compose box: clicking goes to post page
const composeBox = document.getElementById('composeBox');
composeBox.addEventListener('click', () => location.href = 'post.html');

// ------------------ Dropdown menu functionality (reliable) ------------------
function setupPostMenu(card) {
  const menuBtn = card.querySelector('.menu-btn');
  const dropdown = card.querySelector('.menu-dropdown');

  // Toggle
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !dropdown.hasAttribute('data-open');
    // close other dropdowns
    document.querySelectorAll('.menu-dropdown[data-open]').forEach(d => {
      d.removeAttribute('data-open');
      d.hidden = true;
    });
    if (open) {
      dropdown.setAttribute('data-open', 'true');
      dropdown.hidden = false;
    } else {
      dropdown.removeAttribute('data-open');
      dropdown.hidden = true;
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    if (dropdown.hasAttribute('data-open')) {
      dropdown.removeAttribute('data-open');
      dropdown.hidden = true;
    }
  });

  // menu item handlers
  dropdown.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const action = btn.dataset.action;
      const postId = card.dataset.id;
      dropdown.hidden = true;
      dropdown.removeAttribute('data-open');

      if (action === 'repost') {
        await callRepost(postId);
      } else if (action === 'not-interested') {
        await callNotInterested(postId);
      } else if (action === 'fav') {
        await callFavorite(postId);
      } else if (action === 'share') {
        await sharePost(postId);
      }
    });
  });
}

// ------------------ Reaction handlers (Like / Comment / Share) ------------------
async function callLike(postId, countEl) {
  try {
    const res = await fetch(`/posts/${postId}/like`, { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      countEl.textContent = body.likes ?? (parseInt(countEl.textContent || '0') + 1);
    } else {
      // fallback increment if backend not available
      countEl.textContent = (parseInt(countEl.textContent || '0') + 1);
    }
  } catch (e) {
    // offline fallback
    countEl.textContent = (parseInt(countEl.textContent || '0') + 1);
  }
}

async function callComment(postId, countEl) {
  const text = prompt('Write your comment:');
  if (!text) return;
  try {
    const res = await fetch(`/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      countEl.textContent = (parseInt(countEl.textContent || '0') + 1);
      alert('Comment posted');
    } else {
      alert('Failed to post comment (backend).');
    }
  } catch (e) {
    alert('Comment saved locally (no backend).');
    countEl.textContent = (parseInt(countEl.textContent || '0') + 1);
  }
}

async function sharePost(postId) {
  const shareUrl = window.location.origin + '/post.html?id=' + encodeURIComponent(postId);
  if (navigator.share) {
    navigator.share({ title: 'Check this post', url: shareUrl }).catch(()=>{});
  } else {
    // Fallback copy
    await navigator.clipboard.writeText(shareUrl).catch(()=>{});
    alert('Post link copied to clipboard');
  }
}

// Placeholder backend calls for menu actions
async function callRepost(postId) {
  try {
    const res = await fetch(`/posts/${postId}/repost`, { method: 'POST' });
    if (res.ok) {
      alert('Reposted');
      loadFeed(); // refresh feed
    } else alert('Repost failed (backend)');
  } catch (e) { alert('Repost simulated (no backend)'); }
}
async function callNotInterested(postId) {
  try {
    await fetch(`/posts/${postId}/not-interested`, { method: 'POST' });
    alert('Marked not interested');
  } catch (e) { alert('Marked locally (no backend)'); }
}
async function callFavorite(postId) {
  // implement favourites endpoint later; simulating
  alert('Added to favourites (implement POST /posts/{id}/favorite)');
}

// ------------------ Carousel class (re-used for loaded posts) ------------------
class Carousel {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector('.slides');
    this.dots = root.querySelector('.dots');
    this.media = JSON.parse(root.getAttribute('data-media') || '[]');
    this.index = 0;
    this.build();
    this.update();
    this.addListeners();
  }
  build() {
    this.track.innerHTML = '';
    this.dots.innerHTML = '';
    this.media.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.backgroundImage = `url('${src}')`;
      this.track.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => this.go(i));
      this.dots.appendChild(dot);
    });
  }
  update() {
    this.track.style.transform = `translateX(-${this.index * 100}%)`;
    Array.from(this.dots.children).forEach((d, i) => d.classList.toggle('active', i === this.index));
  }
  go(i) { this.index = Math.max(0, Math.min(i, this.media.length - 1)); this.update(); }
  next() { this.go(this.index + 1); }
  prev() { this.go(this.index - 1); }
  addListeners() {
    this.root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });
    let startX = null;
    this.track.addEventListener('pointerdown', e => { startX = e.clientX; });
    this.track.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (dx < -30) this.next();
      if (dx > 30) this.prev();
      startX = null;
    });
  }
}

// ------------------ Feed population & dynamic wiring ------------------
async function loadFeed() {
  const feed = document.getElementById('feed');
  feed.innerHTML = ''; // clear

  // fetch posts from backend if available; fallback to demo item
  let posts = [];
  try {
    const res = await fetch('/posts/feed');
    if (res.ok) posts = await res.json();
  } catch (e) {
    // fallback demo post
    posts = [{
      id: 'demo-1',
      author: 'Alex Rivera',
      content: 'Just finished reading an amazing book on design principles...',
      media: ['media1.jpeg','media2.jpeg','media3.jpeg'],
      likes: 0,
      comments: 0,
      created_at: new Date().toISOString()
    }];
  }

  posts.forEach(p => {
    const tpl = document.querySelector('.post-card.template');
    const card = tpl.cloneNode(true);
    card.classList.remove('template');
    card.hidden = false;
    card.dataset.id = p.id;
    card.querySelector('.avatar').textContent = getInitials(p.author);
    card.querySelector('.author').textContent = p.author;
    card.querySelector('.time').textContent = timeAgo(p.created_at);
    card.querySelector('.post-text').textContent = p.content;
    card.querySelector('.post-body .post-text');

    // set likes/comments counts
    card.querySelector('.count-like').textContent = p.likes ?? 0;
    card.querySelector('.count-comment').textContent = p.comments ?? 0;

    // menu wiring
    setupPostMenu(card);

    // reaction buttons wiring
    const likeBtn = card.querySelector('.like-btn');
    const commentBtn = card.querySelector('.comment-btn');
    const shareBtn = card.querySelector('.share-btn');
    const likeCountEl = card.querySelector('.count-like');
    const commentCountEl = card.querySelector('.count-comment');

    likeBtn.addEventListener('click', (e) => { e.stopPropagation(); callLike(p.id, likeCountEl); });
    commentBtn.addEventListener('click', (e) => { e.stopPropagation(); callComment(p.id, commentCountEl); });
    shareBtn.addEventListener('click', (e) => { e.stopPropagation(); sharePost(p.id); });

    // media carousel wiring
    const carouselEl = card.querySelector('.media-carousel');
    carouselEl.setAttribute('data-media', JSON.stringify(p.media || []));
    // append card to feed BEFORE initializing carousel
    feed.appendChild(card);

    // init carousel for this card
    new Carousel(carouselEl);
  });

  // ensure menu dropdown close on outside clicks
  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown[data-open]').forEach(d => {
      d.removeAttribute('data-open');
      d.hidden = true;
    });
  });
}

// helpers
function getInitials(name){
  if(!name) return 'U';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function timeAgo(iso){ const d = new Date(iso); const s = Math.floor((Date.now()-d.getTime())/1000); if(s<60) return s+'s ago'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }

// initial load
document.addEventListener('DOMContentLoaded', () => loadFeed());
