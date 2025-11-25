// feed.js

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

// Navigation Links (if you want to make the sidebar items clickable)
document.querySelectorAll('.nav li').forEach(li => {
    li.addEventListener('click', () => {
        const label = li.querySelector('.label').innerText.trim();
        if (label === 'Create Post') window.location.href = 'post.html';
        if (label === 'Home') window.location.href = 'feed.html';
        if (label === 'Profile') window.location.href = 'profile.html';
        // Add other links as needed
    });
});


// ============================================================
// 2. CAROUSEL LOGIC (Moved from feed.html)
// ============================================================
class Carousel {
    constructor(root) {
        this.root = root;
        this.track = root.querySelector('.media-track');
        this.dotsWrap = root.querySelector('.dots');
        this.slides = [];
        this.index = 0;
        this.audioEl = null; // optional audio element

        // Parse data-media attribute
        const mediaData = JSON.parse(root.getAttribute('data-media') || '[]');
        mediaData.forEach(item => this.addSlide(item));

        this.render();
        this.addListeners();
    }

    addSlide(item) {
        // item can be a string (url) or object {url, content_type, ...}
        const src = typeof item === 'string' ? item : item.url;
        const type = typeof item === 'string' ? 'image' : (item.content_type || 'image');

        const slide = document.createElement('div');
        slide.className = 'media-slide';

        if (/\.(mp4|webm|ogg)$/i.test(src) || type.startsWith('video')) {
            const v = document.createElement('video');
            v.src = src;
            v.controls = true;
            v.setAttribute('preload', 'metadata');
            slide.appendChild(v);
        } else if (/\.(mp3|wav|m4a)$/i.test(src) || type.startsWith('audio')) {
            // audio-only
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '260px';
            placeholder.style.display = 'grid';
            placeholder.style.placeItems = 'center';
            placeholder.innerText = 'Audio track';
            slide.appendChild(placeholder);

            // create audio element separately if not exists
            if (!this.audioEl) {
                this.audioEl = document.createElement('audio');
                this.audioEl.src = src;
                this.audioEl.preload = 'auto';
            }
        } else {
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'post media';
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

            // Only show dots if more than 1 slide
            if (this.slides.length > 1) {
                const d = document.createElement('button');
                d.className = 'dot-btn'; // Ensure CSS styles this
                // Inline style for dot-btn if not in CSS
                d.style.width = '34px'; d.style.height = '6px'; d.style.borderRadius = '6px'; d.style.border = 'none'; d.style.background = 'rgba(255,255,255,0.4)'; d.style.cursor = 'pointer';

                d.dataset.index = i;
                d.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent post click
                    this.go(i);
                });
                this.dotsWrap.appendChild(d);
            }
        });
        this.update();
    }

    update() {
        if (this.slides.length === 0) return;
        const w = this.root.clientWidth;
        this.track.style.transform = `translateX(${-this.index * w}px)`;

        Array.from(this.dotsWrap.children).forEach((b, i) => {
            b.style.background = (i === this.index) ? '#fff' : 'rgba(255,255,255,0.4)';
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
        window.addEventListener('resize', () => this.update());

        // Keyboard support
        this.root.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        });

        // Swipe support
        let startX = null, moved = false;
        this.track.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            moved = false;
            this.track.setPointerCapture(e.pointerId);
        });
        this.track.addEventListener('pointermove', (e) => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 30) moved = true;
        });
        this.track.addEventListener('pointerup', (e) => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            if (moved) {
                if (dx < 0) this.next();
                else this.prev();
            }
            startX = null;
            moved = false;
        });

        // Audio controls
        if (this.audioEl) {
            const controls = this.root.querySelector('.audio-controls');
            if (controls) {
                controls.style.display = 'flex';
                const playBtn = controls.querySelector('#audioPlay');
                const muteBtn = controls.querySelector('#audioMute');

                if (playBtn) playBtn.addEventListener('click', () => this.audioEl.paused ? this.audioEl.play() : this.audioEl.pause());
                if (muteBtn) muteBtn.addEventListener('click', () => this.audioEl.muted = !this.audioEl.muted);
            }
        }
    }
}


// ============================================================
// 3. FEED LOGIC
// ============================================================

async function loadFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    feedContainer.innerHTML = ''; // Clear existing content

    // Fetch posts
    let posts = [];
    try {
        const res = await fetch('http://localhost:8000/posts');
        if (res.ok) {
            posts = await res.json();
        } else {
            console.error("Failed to fetch posts");
            feedContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Failed to load posts.</div>';
            return;
        }
    } catch (e) {
        console.error("Error fetching posts:", e);
        feedContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Error loading posts. Is the server running?</div>';
        return;
    }

    if (posts.length === 0) {
        feedContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">No posts yet. Be the first to post!</div>';
        return;
    }

    const template = document.getElementById('post-template');

    posts.forEach(p => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.post');

        // Set ID
        card.dataset.id = p._id;

        // Meta Info
        const authorName = p.author || "Anonymous"; // You might need to fetch user details if not in post
        card.querySelector('.name').textContent = authorName;
        card.querySelector('.avatar').textContent = getInitials(authorName);
        card.querySelector('.time').textContent = timeAgo(p.created_at);

        // Caption & Details
        let contentHtml = `<strong>${escapeHtml(p.caption || "")}</strong>`;
        if (p.description) contentHtml += `<br><span style="font-size:0.9em; color:#dbeeff;">${escapeHtml(p.description)}</span>`;
        if (p.feeling) contentHtml += `<br><em style="color:var(--muted)">Feeling ${escapeHtml(p.feeling)}</em>`;
        if (p.location) contentHtml += ` <span style="color:var(--muted)">📍 ${escapeHtml(p.location)}</span>`;

        card.querySelector('.caption').innerHTML = contentHtml;

        // Media
        const mediaContainer = card.querySelector('.media');
        if (p.media && p.media.length > 0) {
            mediaContainer.setAttribute('data-media', JSON.stringify(p.media));
            // Initialize Carousel later (after appending to DOM)
        } else {
            mediaContainer.style.display = 'none';
        }

        // Menu Actions
        setupPostMenu(card, p._id);

        feedContainer.appendChild(card);

        // Initialize Carousel if media exists
        if (p.media && p.media.length > 0) {
            new Carousel(mediaContainer);
        }
    });
}

// Helper: Setup Menu
function setupPostMenu(card, postId) {
    const menuBtn = card.querySelector('.three-btn');
    const dropdown = card.querySelector('.dropdown');

    if (!menuBtn || !dropdown) return;

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close others
        document.querySelectorAll('.three-dot.open').forEach(el => {
            if (el !== card.querySelector('.three-dot')) el.classList.remove('open');
        });
        card.querySelector('.three-dot').classList.toggle('open');
    });

    // Edit Action
    const editBtn = dropdown.querySelector('[data-action="edit"]');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `post.html?id=${postId}`;
        });
    }

    // Other actions (placeholders)
    dropdown.querySelectorAll('button').forEach(btn => {
        if (btn.dataset.action !== 'edit') {
            btn.addEventListener('click', () => {
                alert(`Action ${btn.innerText} clicked for post ${postId}`);
            });
        }
    });
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
document.addEventListener('click', () => {
    document.querySelectorAll('.three-dot.open').forEach(el => el.classList.remove('open'));
});


// ============================================================
// 4. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
});
