/**
 * BookVerse — Library Page JavaScript
 * library.js
 *
 * User-controlled library connected to SQLite database via /api/user/books.
 * Renders enchanted 3D physical book chassis with hover opening effect.
 */

(function () {
  'use strict';

  let booksData = [];
  let currentFilter = 'all';

  /* ====================================================
     1. LOAD USER'S BOOKS DATA FROM API
     New users start with an EMPTY library (0 books).
     ==================================================== */
  async function loadBooks() {
    const container = document.getElementById('library-books-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: #87927B; grid-column: 1 / -1;">
          <div class="loading-ornament" style="margin: 0 auto 12px auto;"></div>
          <p style="font-family: var(--font-serif); font-size: 18px;">Consulting your personal archives&hellip;</p>
        </div>
      `;
    }

    try {
      const response = await fetch('/api/user/books');
      if (!response.ok) {
        throw new Error('Failed to load user books: ' + response.status);
      }
      const data = await response.json();
      booksData = data.books || [];
      console.log('User books loaded:', booksData.length);
      updateFilterCounts();
      renderLibrary();
    } catch (error) {
      console.error('Error loading user books:', error);
      booksData = [];
      updateFilterCounts();
      renderLibrary();
    }
  }

  /* ====================================================
     2. UPDATE FILTER COUNTS
     ==================================================== */
  function updateFilterCounts() {
    const allCount = booksData.length;
    const readingCount = booksData.filter(b => b.status === 'reading').length;
    const completedCount = booksData.filter(b => b.status === 'completed').length;
    const wishlistCount = booksData.filter(b => b.status === 'want-to-read').length;

    const elAll = document.getElementById('filter-count-all');
    const elReading = document.getElementById('filter-count-reading');
    const elCompleted = document.getElementById('filter-count-completed');
    const elWishlist = document.getElementById('filter-count-wishlist');

    if (elAll) elAll.textContent = `(${allCount})`;
    if (elReading) elReading.textContent = `(${readingCount})`;
    if (elCompleted) elCompleted.textContent = `(${completedCount})`;
    if (elWishlist) elWishlist.textContent = `(${wishlistCount})`;
  }

  /* ====================================================
     3. RENDER LIBRARY WITH ENCHANTED 3D BOOK CHASSIS
     ==================================================== */
  function renderLibrary() {
    const container = document.getElementById('library-books-container');
    if (!container) return;

    // Filter books based on selected tab
    let filteredBooks = booksData;
    if (currentFilter !== 'all') {
      filteredBooks = booksData.filter(b => b.status === currentFilter);
    }

    if (filteredBooks.length === 0) {
      if (booksData.length === 0) {
        // Complete empty state for brand new user
        container.innerHTML = `
          <div style="
            text-align: center;
            padding: 72px 24px;
            color: #4a3728;
            grid-column: 1 / -1;
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid rgba(182, 154, 99, 0.25);
            box-shadow: 0 8px 24px rgba(13, 24, 16, 0.06);
          ">
            <div style="display: flex; justify-content: center; margin-bottom: 20px; color: #B69A63;">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="8" y1="10" x2="14" y2="10"></line>
              </svg>
            </div>
            <h3 style="
              font-family: var(--font-serif);
              font-size: 28px;
              font-weight: 500;
              margin-bottom: 8px;
              color: var(--forest-deep);
            ">Your library is waiting for its first volume</h3>
            <p style="color: #6B4B35; max-width: 500px; margin: 0 auto 28px auto; font-size: 15px; line-height: 1.6;">
              Your personal library starts empty. Search the archives or add a book to curate your private collection.
            </p>
            <a href="/add-book" class="continue-reading-btn" style="display: inline-flex; align-items: center; gap: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Add Your First Book</span>
            </a>
          </div>
        `;
      } else {
        // Filter returned no results
        const filterNames = {
          'reading': 'Currently Reading',
          'completed': 'Completed',
          'want-to-read': 'Want to Read'
        };
        const name = filterNames[currentFilter] || currentFilter;
        container.innerHTML = `
          <div style="text-align: center; padding: 64px 20px; color: #87927B; grid-column: 1 / -1;">
            <p style="font-family: var(--font-serif); font-size: 20px; color: var(--forest-deep); margin-bottom: 8px;">No books in ${name}</p>
            <p style="font-size: 14px; margin-bottom: 20px;">You do not have any books currently marked with this status.</p>
            <button onclick="filterLibrary('all')" class="genre-chip active" style="cursor: pointer;">View All Books</button>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
  }

  /* ====================================================
     4. CREATE ENCHANTED 3D BOOK CARD
     Smooth floating lift, 3D hardcover spine rotation,
     marbled endpapers, parchment pages, and golden sparks.
     ==================================================== */
  function createBookCard(book) {
    const coverSrc = book.cover || '';
    const genre = book.genre ? `<span class="book-genre">${escapeHtml(book.genre)}</span>` : '';
    const pages = book.pages ? `<span>${book.pages} pp.</span>` : '';
    const progress = book.progress || 0;
    const pagesRead = book.current_page || Math.round((progress / 100) * (book.pages || 0));

    let progressBarHtml = '';
    if (book.status === 'reading') {
      progressBarHtml = `
        <div class="reading-progress" style="margin-top: 8px;">
          <div class="progress-label" style="font-size: 11px;">
            <span>Progress</span>
            <span>${progress}%</span>
          </div>
          <div class="reading-progress-bar" style="height: 4px;">
            <div class="reading-progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      `;
    } else if (book.status === 'completed') {
      progressBarHtml = `
        <div style="margin-top: 8px; font-size: 11px; color: #63996E; font-weight: 600; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Finished</span>
        </div>
      `;
    }

    return `
      <div class="book-card" data-book-id="${book.id}" onclick="viewBook(${book.id})" role="listitem">
        <div class="book-cover-wrapper">
          <div class="reading-book-stage">
            <div class="book-3d-chassis">
              <!-- Ground Shadow -->
              <div class="book-ground-shadow" aria-hidden="true"></div>

              <!-- Back Hardcover -->
              <div class="book-back-cover" aria-hidden="true">
                <div class="book-back-lining"></div>
              </div>

              <!-- Spine with Gold Ribs -->
              <div class="book-spine" aria-hidden="true">
                <div class="spine-ribs"></div>
              </div>

              <!-- Page Block Thickness -->
              <div class="book-page-block" aria-hidden="true">
                <div class="page-edge-top"></div>
                <div class="page-edge-right"></div>
                <div class="page-edge-bottom"></div>
              </div>

              <!-- Interior Parchment & Reading Leaf -->
              <div class="book-interior" aria-hidden="true">
                <div class="page-leaf page-leaf-under"></div>
                <div class="page-leaf page-leaf-main">
                  <div class="page-magic-glow"></div>
                  <div class="page-content-wrapper">
                    <div class="page-header-ornament">✦ ❦ ✦</div>
                    <div class="page-book-title">${escapeHtml(book.title || 'Untitled')}</div>
                    <div class="page-book-author">by ${escapeHtml(book.author || 'Unknown')}</div>
                    <div class="page-lines">
                      <span></span><span></span><span></span>
                    </div>
                    <div class="page-footer-mark">${book.pages ? book.pages + ' pp.' : 'BookVerse'}</div>
                  </div>

                  <!-- Silk Ribbon Bookmark -->
                  <div class="book-ribbon"></div>

                  <!-- Golden Magical Sparks -->
                  <div class="book-sparks-container">
                    <span class="book-spark bs1"></span>
                    <span class="book-spark bs2"></span>
                    <span class="book-spark bs3"></span>
                    <span class="book-spark bs4"></span>
                    <span class="book-spark bs5"></span>
                  </div>
                </div>
              </div>

              <!-- 3D Front Hardcover -->
              <div class="book-front-cover" aria-hidden="true">
                <div class="cover-exterior">
                  <img
                    src="${coverSrc}"
                    alt="${escapeHtml(book.title || 'Book cover')}"
                    class="reading-cover-img"
                    loading="lazy"
                    onerror="this.style.opacity='0.3'"
                  >
                  <div class="cover-crease-shadow"></div>
                  <div class="cover-leather-sheen"></div>
                </div>
                <div class="cover-interior">
                  <div class="endpaper-marbled">
                    <div class="ex-libris-frame">
                      <span class="ex-libris-title">EX LIBRIS</span>
                      <span class="ex-libris-seal">❧</span>
                      <span class="ex-libris-sub">BOOKVERSE</span>
                    </div>
                  </div>
                </div>
              </div>

            </div><!-- /.book-3d-chassis -->
          </div><!-- /.reading-book-stage -->
        </div><!-- /.book-cover-wrapper -->

        <div class="book-info">
          <h4 class="book-title">${escapeHtml(book.title || 'Untitled')}</h4>
          <p class="book-author">${escapeHtml(book.author || 'Unknown Author')}</p>
          <div class="book-meta">
            ${genre}
            ${pages}
          </div>
          ${progressBarHtml}
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ====================================================
     5. SEARCH FUNCTIONALITY (Real-time Filter)
     ==================================================== */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase().trim();
      const container = document.getElementById('library-books-container');
      
      if (query === '') {
        renderLibrary();
        return;
      }

      const pool = currentFilter === 'all' 
        ? booksData 
        : booksData.filter(b => b.status === currentFilter);

      const filtered = pool.filter(book => {
        return (book.title && book.title.toLowerCase().includes(query)) ||
               (book.author && book.author.toLowerCase().includes(query)) ||
               (book.genre && book.genre.toLowerCase().includes(query));
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 64px; color: #87927B; grid-column: 1 / -1;">
            <p style="font-family: var(--font-serif); font-size: 20px; color: var(--forest-deep); margin-bottom: 8px;">No matching books found</p>
            <p style="font-size: 14px;">No volumes matching "${escapeHtml(query)}" found in your personal library.</p>
          </div>
        `;
      } else {
        container.innerHTML = filtered.map(book => createBookCard(book)).join('');
      }
    });
  }

  /* ====================================================
     6. FILTER HANDLER & TAB STATE
     ==================================================== */
  window.filterLibrary = function(filter) {
    currentFilter = filter;

    // Update active button state
    document.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });

    renderLibrary();
  };

  /* ====================================================
     7. INITIALIZE
     ==================================================== */
  function init() {
    console.log('BookVerse Library Initializing...');
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && ['all', 'reading', 'completed', 'want-to-read'].includes(filterParam)) {
      currentFilter = filterParam;
      document.querySelectorAll('.filter-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filterParam);
      });
    }
    loadBooks();
  }

  async function quickCompleteBook(bookId) {
    try {
      const res = await fetch('/api/user/books/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          status: 'completed',
          progress: 100
        })
      });
      const data = await res.json();
      if (data.success) {
        const book = booksData.find(b => b.id === bookId);
        if (book) {
          book.status = 'completed';
          book.progress = 100;
        }
        updateFilterCounts();
        renderLibrary();
      }
    } catch (err) {
      console.error('Error completing book:', err);
    }
  }
  window.quickCompleteBook = quickCompleteBook;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.viewBook = function(bookId) {
    window.location.href = `/book?id=${bookId}`;
  };

})();
