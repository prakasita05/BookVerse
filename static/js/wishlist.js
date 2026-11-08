/* ============================================================
   BOOKVERSE — WISHLIST JAVASCRIPT
   Clean, reactive wishlist management with zero emojis
   ============================================================ */

(function () {
  'use strict';

  let wishlistBooks = [];

  document.addEventListener('DOMContentLoaded', () => {
    loadWishlist();
    setupSearch();
  });

  // Load wishlist from backend API
  async function loadWishlist() {
    const grid = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('wishlist-empty-state');
    const countEl = document.getElementById('wishlist-count-display');

    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();

      if (data.success) {
        wishlistBooks = data.books || [];
        updateCountDisplay(wishlistBooks.length);
        renderWishlist(wishlistBooks);
      } else {
        grid.innerHTML = '<p style="text-align:center; color:#c94a4a; padding:40px;">Failed to load wishlist archives.</p>';
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
      grid.innerHTML = '<p style="text-align:center; color:#c94a4a; padding:40px;">Network error connecting to the archives.</p>';
    }
  }

  function updateCountDisplay(count) {
    const countEl = document.getElementById('wishlist-count-display');
    const badgeEl = document.getElementById('wishlist-badge-count');
    if (countEl) {
      countEl.textContent = count === 1 ? '1 Volume Inscribed' : `${count} Volumes Inscribed`;
    }
    if (badgeEl) {
      badgeEl.textContent = `${count} Volumes`;
    }
  }

  function renderWishlist(books) {
    const grid = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('wishlist-empty-state');

    if (!books || books.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = books.map(book => createWishlistCard(book)).join('');
  }

  function createWishlistCard(book) {
    const cover = book.cover || 'https://via.placeholder.com/120x180/2b1a0e/B69A63?text=BookVerse';
    const pages = book.pages ? `${book.pages} pp.` : '';
    const year = book.publication_year || '';
    const meta = [year, pages].filter(Boolean).join(' · ');
    const titleEscaped = escapeHtml(book.title);
    const authorEscaped = escapeHtml(book.author);
    const genreEscaped = escapeHtml(book.genre || 'Fiction');

    return `
      <div class="wishlist-card" id="wishlist-card-${book.id}">
        <div class="wishlist-card-cover-wrapper">
          <img 
            src="${escapeAttr(cover)}" 
            alt="${titleEscaped}" 
            class="wishlist-card-cover"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/120x180/2b1a0e/B69A63?text=BookVerse'"
          />
        </div>
        <div class="wishlist-card-content">
          <div>
            <div class="wishlist-card-genre">${genreEscaped}</div>
            <h3 class="wishlist-card-title" title="${titleEscaped}">${titleEscaped}</h3>
            <p class="wishlist-card-author">by ${authorEscaped}</p>
            ${meta ? `<div class="wishlist-card-meta">${meta}</div>` : ''}
            <p class="wishlist-card-desc">${escapeHtml(book.description || '')}</p>
          </div>
          
          <div class="wishlist-card-actions">
            <a href="/book?id=${book.id}" class="btn-start-read">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <span>View Volume</span>
            </a>
            <button 
              type="button" 
              class="btn-remove-wishlist" 
              onclick="removeFromWishlist(${book.id}, '${escapeAttr(book.title)}')"
              title="Remove from Wishlist"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Remove book from Wishlist with smooth animation
  async function removeFromWishlist(bookId, bookTitle) {
    const card = document.getElementById(`wishlist-card-${bookId}`);
    if (card) {
      card.classList.add('removing');
    }

    try {
      const res = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId })
      });
      const data = await res.json();

      if (data.success) {
        // Remove locally from array
        wishlistBooks = wishlistBooks.filter(b => b.id !== bookId);
        updateCountDisplay(wishlistBooks.length);

        setTimeout(() => {
          if (card) card.remove();
          if (wishlistBooks.length === 0) {
            renderWishlist([]);
          }
        }, 250);

        showWishlistToast(`"${bookTitle}" removed from your Wishlist`);
      } else {
        if (card) card.classList.remove('removing');
        showWishlistToast(data.error || 'Failed to remove book');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      if (card) card.classList.remove('removing');
      showWishlistToast('Network error removing volume');
    }
  }
  window.removeFromWishlist = removeFromWishlist;

  // Search filter
  function setupSearch() {
    const input = document.getElementById('wishlist-search');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderWishlist(wishlistBooks);
        return;
      }
      const filtered = wishlistBooks.filter(b => 
        (b.title || '').toLowerCase().includes(term) ||
        (b.author || '').toLowerCase().includes(term) ||
        (b.genre || '').toLowerCase().includes(term)
      );
      renderWishlist(filtered);
    });
  }

  // Toast notification
  function showWishlistToast(msg) {
    let toast = document.getElementById('wishlist-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wishlist-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #1A2E22;
        color: #F7F2E7;
        padding: 14px 22px;
        border-radius: 8px;
        border: 1px solid #B69A63;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B69A63" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHtml(msg)}</span>
    `;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

})();

