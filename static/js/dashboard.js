/**
 * BookVerse — Internal Dashboard JavaScript
 * dashboard.js
 *
 * Data sources:
 *  - User reading data:    /static/data/books.json  (local, user-owned)
 *  - Book discovery:       Open Library Search API  (live, external, no key needed)
 *
 * Global book metadata (title, author, cover, rating from API) is NEVER
 * conflated with the user's personal reading status, progress, or ratings.
 */

(function () {
  'use strict';

  /* ============================================================
     CONSTANTS
     ============================================================ */
  const OL_SEARCH  = 'https://openlibrary.org/search.json';
  const OL_COVERS  = 'https://covers.openlibrary.org/b/id/';
  const OL_COVER_S = '-S.jpg';
  const OL_COVER_M = '-M.jpg';

  /* ============================================================
     1. USER READING DATA (Retrieved from user's personal database)
     ============================================================ */
  let userBooksData = [];

  async function loadUserBooks() {
    try {
      const response = await fetch('/api/user/books');
      if (!response.ok) throw new Error('Failed to load user books');
      const data = await response.json();
      userBooksData = data.books || [];
    } catch (err) {
      console.warn('Could not load user books:', err.message);
      userBooksData = [];
    }
    renderUserSections();
  }

  /* ============================================================
     2. RENDER USER-SPECIFIC SECTIONS
     ============================================================ */
  function renderUserSections() {
    renderStats();
    renderCurrentlyReading();
    renderRecentlyAdded();
  }

  /* ============================================================
     3. READING STATISTICS (computed from user data only)
     ============================================================ */
  function renderStats() {
    const completed       = userBooksData.filter(b => b.status === 'completed');
    const reading         = userBooksData.filter(b => b.status === 'reading');
    const wantToRead      = userBooksData.filter(b => b.status === 'want-to-read');
    const totalPagesRead  = completed.reduce((sum, b) => sum + (b.pages || 0), 0);

    setStat('stat-books-read',       completed.length);
    setStat('stat-currently-reading', reading.length);
    setStat('stat-want-to-read',     wantToRead.length);
    setStat('stat-day-streak',       0);   // tracked by user activity — starts at 0
    setStat('stat-pages-read',       totalPagesRead);
    setStat('stat-saved-quotes',     0);   // user-entered quotes — starts at 0
  }

  function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) {
      // Animate counter up
      const target = parseInt(value, 10);
      let current  = 0;
      const step   = Math.max(1, Math.ceil(target / 30));
      const tick   = () => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ============================================================
     4. CURRENTLY READING (user-owned reading data)
     ============================================================ */
  function renderCurrentlyReading() {
    const container = document.getElementById('currently-reading-container');
    if (!container) return;

    const reading = userBooksData.filter(b => b.status === 'reading');

    if (reading.length === 0) {
      container.innerHTML = `
        <div class="empty-reading-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h3 class="empty-state-title">Your reading shelf is empty</h3>
          <p class="empty-state-text">
            Begin your literary adventure. Add a book to your library and
            mark it as currently reading to track your journey.
          </p>
          <a href="/library" class="empty-state-cta" id="explore-books-cta">
            Explore Books
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = reading.map(book => buildReadingCard(book)).join('');
  }

  function buildReadingCard(book) {
    // User's personal progress — only from their own data, never API-sourced
    const progress = Math.min(100, Math.max(0, book.progress || 0));
    const pagesRead = book.pages ? Math.round(book.pages * progress / 100) : '?';
    const coverSrc  = book.cover || '';
    const coverAlt  = escapeHtml(book.title || 'Book cover');

    return `
      <div class="reading-card" data-book-id="${book.id}" role="listitem">
        <!-- Interactive 3D Enchanted Book Assembly -->
        <div class="reading-book-stage"
             onclick="viewBook(${book.id})"
             tabindex="0"
             role="button"
             aria-label="Open book: ${escapeHtml(book.title || '')}">
          <div class="book-3d-chassis">
            <!-- Ground contact shadow -->
            <div class="book-ground-shadow" aria-hidden="true"></div>

            <!-- Back hardcover and spine -->
            <div class="book-back-cover" aria-hidden="true">
              <div class="book-back-lining"></div>
            </div>

            <div class="book-spine" aria-hidden="true">
              <div class="spine-ribs"></div>
            </div>

            <!-- Page block thickness -->
            <div class="book-page-block" aria-hidden="true">
              <div class="page-edge-top"></div>
              <div class="page-edge-right"></div>
              <div class="page-edge-bottom"></div>
            </div>

            <!-- Interior pages revealed upon opening -->
            <div class="book-interior" aria-hidden="true">
              <!-- Under page leaf with organic fan angle -->
              <div class="page-leaf page-leaf-under"></div>

              <!-- Main reading page with antique bookplate & excerpt -->
              <div class="page-leaf page-leaf-main">
                <div class="page-magic-glow"></div>

                <div class="page-content-wrapper">
                  <div class="page-header-ornament">✦ ❦ ✦</div>
                  <div class="page-book-title">${escapeHtml(book.title || 'Untitled')}</div>
                  <div class="page-book-author">by ${escapeHtml(book.author || 'Unknown')}</div>
                  <div class="page-lines">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <div class="page-footer-mark">Page ${pagesRead} of ${book.pages || '—'}</div>
                </div>

                <!-- Silk bookmark ribbon -->
                <div class="book-ribbon"></div>

                <!-- Magical golden stardust sparks -->
                <div class="book-sparks-container">
                  <span class="book-spark bs1"></span>
                  <span class="book-spark bs2"></span>
                  <span class="book-spark bs3"></span>
                  <span class="book-spark bs4"></span>
                  <span class="book-spark bs5"></span>
                </div>
              </div>
            </div>

            <!-- 3D Turning Front Cover -->
            <div class="book-front-cover" aria-hidden="true">
              <!-- Exterior: Real book cover image -->
              <div class="cover-exterior">
                <img
                  src="${coverSrc}"
                  alt="${coverAlt}"
                  class="reading-cover-img"
                  loading="lazy"
                  onerror="this.style.opacity='0.4'"
                >
                <div class="cover-crease-shadow"></div>
                <div class="cover-leather-sheen"></div>
              </div>

              <!-- Interior: Marbled endpaper & Ex Libris seal -->
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

        <!-- Book Reading Details -->
        <div class="reading-details">
          <div>
            <h3 class="reading-title">${escapeHtml(book.title || 'Untitled')}</h3>
            <p class="reading-author">by ${escapeHtml(book.author || 'Unknown Author')}</p>
          </div>
          <div>
            <div class="reading-progress">
              <div class="progress-label">
                <span>Your Progress</span>
                <span>${progress}%</span>
              </div>
              <div class="reading-progress-bar" role="progressbar"
                   aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                <div class="reading-progress-fill" style="width: ${progress}%"></div>
              </div>
            </div>
            <p class="reading-pages">${pagesRead} of ${book.pages || '—'} pages</p>
            <button
              class="continue-btn"
              id="continue-btn-${book.id}"
              onclick="viewBook(${book.id})"
              aria-label="Continue reading ${escapeHtml(book.title || '')}"
            >
              Continue Reading
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     5. RECENTLY ADDED (personal library — from user data)
     ============================================================ */
  function renderRecentlyAdded() {
    const container = document.getElementById('recently-added-container');
    if (!container) return;

    const recent = userBooksData.slice(-6).reverse();

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-reading-state" style="grid-column: 1/-1;">
          <p class="empty-state-text">No books in your library yet. Start by discovering some below.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(book => buildLocalBookCard(book)).join('');
  }

  function buildLocalBookCard(book) {
    const coverSrc = book.cover || '';
    const genre    = book.genre ? `<span class="book-genre">${escapeHtml(book.genre)}</span>` : '';
    const pages    = book.pages ? `<span>${book.pages} pp.</span>` : '';

    return `
      <div class="book-card" data-book-id="${book.id}"
           onclick="viewBook(${book.id})"
           role="listitem"
           aria-label="${escapeHtml(book.title || 'Book')} by ${escapeHtml(book.author || '')}">
        <div class="book-cover-wrapper">
          <div class="reading-book-stage">
            <div class="book-3d-chassis">
              <div class="book-ground-shadow" aria-hidden="true"></div>
              <div class="book-back-cover" aria-hidden="true">
                <div class="book-back-lining"></div>
              </div>
              <div class="book-spine" aria-hidden="true">
                <div class="spine-ribs"></div>
              </div>
              <div class="book-page-block" aria-hidden="true">
                <div class="page-edge-top"></div>
                <div class="page-edge-right"></div>
                <div class="page-edge-bottom"></div>
              </div>
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
                  </div>
                  <div class="book-ribbon"></div>
                  <div class="book-sparks-container">
                    <span class="book-spark bs1"></span>
                    <span class="book-spark bs2"></span>
                    <span class="book-spark bs3"></span>
                  </div>
                </div>
              </div>
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
            </div>
          </div>
        </div>
        <div class="book-info">
          <h4 class="book-title">${escapeHtml(book.title || 'Untitled')}</h4>
          <p class="book-author">${escapeHtml(book.author || 'Unknown')}</p>
          <div class="book-meta">
            ${genre}
            ${pages}
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     6. OPEN LIBRARY DISCOVER — real external book metadata
     Global ratings shown as secondary, muted metadata.
     Personal ratings/status are NEVER prepopulated.
     ============================================================ */

  let discoverAbortController = null;
  let activeChipQuery = 'fiction classics';
  const discoverResultsMap = {};
  const workDescriptionsCache = {};

  async function searchOpenLibrary(query, limit = 16) {
    const container = document.getElementById('discover-results-container');
    if (!container) return;

    // Cancel any in-flight request
    if (discoverAbortController) discoverAbortController.abort();
    discoverAbortController = new AbortController();

    // Hide any currently floating panel
    if (window.hideFloatingBookPanel) window.hideFloatingBookPanel();

    container.innerHTML = `
      <div class="bookshelf-loading-state">
        <div class="loading-quill-ornament" aria-hidden="true"></div>
        <p>Consulting the Great Archives for &ldquo;${escapeHtml(query)}&rdquo;&hellip;</p>
      </div>
    `;

    try {
      // Call backend search endpoint with multi-tier fallback (Open Library -> Google Books -> Local Catalog)
      const res = await fetch(`/api/discover/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        signal: discoverAbortController.signal
      });

      if (!res.ok) throw new Error('Discover API error: ' + res.status);

      const data = await res.json();
      const docs = (data.books || []).filter(b => b.title);

      if (docs.length === 0) {
        container.innerHTML = `
          <div class="bookshelf-empty-state">
            <p class="empty-bookshelf-title">The shelves sit quiet</p>
            <p class="empty-bookshelf-sub">No tomes found matching &ldquo;${escapeHtml(query)}&rdquo; in the archives. Try searching for a classic author, mythical realm, or subject.</p>
          </div>
        `;
        return;
      }

      // Cache docs by key for instant retrieval and library operations
      docs.forEach(doc => {
        if (doc.key) discoverResultsMap[doc.key] = doc;
      });

      // Render into realistic, spacious wooden bookshelf tiers (5 books per tier for wide shelf)
      const BOOKS_PER_SHELF = 5;
      let tiersHtml = '';
      for (let i = 0; i < docs.length; i += BOOKS_PER_SHELF) {
        const shelfDocs = docs.slice(i, i + BOOKS_PER_SHELF);
        const tierNum = Math.floor(i / BOOKS_PER_SHELF) + 1;
        tiersHtml += `
          <div class="bookshelf-tier" data-tier="${tierNum}" role="region" aria-label="Bookshelf Tier ${tierNum}">
            <div class="bookshelf-tier-books" role="list">
              ${shelfDocs.map((doc, idx) => buildShelfBookStand(doc, idx, shelfDocs.length)).join('')}
            </div>
            <!-- Physical dark walnut shelf plank with golden specular bevel lip and drop shadow -->
            <div class="bookshelf-plank" aria-hidden="true">
              <div class="plank-surface"></div>
              <div class="plank-lip">
                <div class="plank-lip-highlight"></div>
                <div class="plank-wood-grain"></div>
              </div>
              <div class="plank-under-shadow"></div>
            </div>
          </div>
        `;
      }

      container.innerHTML = tiersHtml;

      // Initialize the floating parchment popover (anchored outside shelf stacking contexts)
      initShelfFloatingPanel();

    } catch (err) {
      if (err.name === 'AbortError') return; // request was cancelled — do nothing

      console.error('Discover search error:', err);
      container.innerHTML = `
        <div class="bookshelf-empty-state">
          <p class="empty-bookshelf-title">The archive connection flickers</p>
          <p class="empty-bookshelf-sub">Unable to reach the Great Archives. Please check your network and search again.</p>
        </div>
      `;
    }
  }

  /* ============================================================
     BUILD STANDING PHYSICAL BOOK ON WOODEN SHELF
     With realistic 3D storybook opening & natural height/depth variations
     ============================================================ */
  function buildShelfBookStand(doc, indexInRow, totalInRow) {
    const title = escapeHtml(doc.title || 'Untitled');
    const author = doc.author
      ? escapeHtml(doc.author)
      : (doc.author_name && doc.author_name.length ? escapeHtml(doc.author_name[0]) : 'Unknown Author');

    const workKey = (doc.key || '').replace('/works/', '').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Natural physical variations across books on the shelf:
    const HEIGHT_PRESETS = [192, 204, 185, 200, 195];
    const bookHeight = HEIGHT_PRESETS[indexInRow % HEIGHT_PRESETS.length];

    const DEPTH_CLASSES = ['depth-normal', 'depth-back', 'depth-forward', 'depth-subtle-back', 'depth-subtle-forward'];
    const depthClass = DEPTH_CLASSES[indexInRow % DEPTH_CLASSES.length];

    const pageCount = doc.pages || doc.number_of_pages_median || 320;
    const spineWidth = pageCount > 450 ? 17 : (pageCount < 250 ? 11 : 14);

    // Robust cover resolution with neutral antique leather/cloth fallback
    const coverSrc = (doc.cover && typeof doc.cover === 'string' && doc.cover.trim())
      ? doc.cover
      : (doc.cover_i ? `${OL_COVERS}${doc.cover_i}${OL_COVER_L}` : '');

    const hasCoverImage = Boolean(coverSrc);

    return `
      <div class="shelf-book-stand ${depthClass}"
           style="height: ${bookHeight}px;"
           data-key="${escapeAttr(doc.key || '')}"
           data-work-key="${escapeAttr(workKey)}"
           role="listitem"
           tabindex="0"
           aria-label="${title} by ${author}">

        <!-- Contact ground shadow cast on the wooden shelf plank -->
        <div class="shelf-contact-shadow" aria-hidden="true"></div>

        <!-- 3D Enchanted Physical Book Chassis (Standing Upright) -->
        <div class="reading-book-stage">
          <div class="book-3d-chassis">
            <div class="book-ground-shadow" aria-hidden="true"></div>

            <!-- Back Hardcover -->
            <div class="book-back-cover" aria-hidden="true">
              <div class="book-back-lining"></div>
            </div>

            <!-- Spine with Embossed Gold Ribs -->
            <div class="book-spine" style="width: ${spineWidth}px;" aria-hidden="true">
              <div class="spine-ribs"></div>
            </div>

            <!-- Page Block Thickness -->
            <div class="book-page-block" aria-hidden="true">
              <div class="page-edge-top"></div>
              <div class="page-edge-right"></div>
              <div class="page-edge-bottom"></div>
            </div>

            <!-- Interior Parchment & Fluffy Storybook Reading Leaf -->
            <div class="book-interior" aria-hidden="true">
              <div class="page-leaf page-leaf-under"></div>
              <div class="page-leaf page-leaf-main">
                <div class="page-magic-glow"></div>
                <div class="page-content-wrapper">
                  <div class="page-header-ornament">✦ ❦ ✦</div>
                  <div class="page-book-title">${title}</div>
                  <div class="page-book-author">by ${author}</div>
                  <div class="page-lines">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="page-footer-mark">${pageCount ? pageCount + ' pp.' : 'BookVerse'}</div>
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

            <!-- 3D Turning Front Hardcover (Opens like fluffy soft-paged book) -->
            <div class="book-front-cover" aria-hidden="true">
              <div class="cover-exterior">
                ${hasCoverImage ? `
                  <img
                    src="${coverSrc}"
                    alt="${title}"
                    class="reading-cover-img"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  >
                ` : ''}

                <!-- Tasteful neutral antique cloth/leather fallback (never broken image or emoji) -->
                <div class="reading-cover-fallback" style="${hasCoverImage ? 'display:none;' : 'display:flex;'}">
                  <div class="fallback-frame">
                    <span class="fallback-seal">❧</span>
                    <span class="fallback-title">${title}</span>
                    <span class="fallback-author">${author}</span>
                  </div>
                </div>

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

        <!-- Subtle brass title label beneath the book on the shelf -->
        <div class="shelf-book-brass-label" aria-hidden="true">
          <span class="brass-label-text">${title}</span>
        </div>

      </div><!-- /.shelf-book-stand -->
    `;
  }

  /* ============================================================
     FLOATING PARCHMENT INFORMATION PANEL (CRITICAL REQUIREMENT)
     Single, viewport-aware card floating OUTSIDE the shelf hierarchy.
     Never clipped by containers, never hidden behind other books.
     ============================================================ */
  function initShelfFloatingPanel() {
    const panel = document.getElementById('shelf-floating-panel');
    const wrapper = document.querySelector('.enchanted-bookshelf-wrapper');
    if (!panel || !wrapper) return;

    let activeKey = null;
    let hideTimer = null;

    const stands = document.querySelectorAll('.shelf-book-stand');

    function renderPanelContent(doc) {
      const title = escapeHtml(doc.title || 'Untitled');
      const author = doc.author
        ? escapeHtml(doc.author)
        : (doc.author_name && doc.author_name.length ? escapeHtml(doc.author_name[0]) : 'Unknown Author');
      const workKey = (doc.key || '').replace('/works/', '').replace(/[^a-zA-Z0-9_-]/g, '_');

      // Subjects / Categories (up to 3)
      const subjects = (doc.subjects || doc.subject || (doc.genre ? [doc.genre] : [])).slice(0, 3);
      const subjectChipsHtml = subjects.length
        ? `<div class="parchment-chips">
             ${subjects.map(s => `<span class="parchment-chip">${escapeHtml(s.length > 20 ? s.slice(0, 20) + '…' : s)}</span>`).join('')}
           </div>`
        : '';

      // Metadata Items - Only show available fields gracefully!
      const metaItems = [];
      const pubYear = doc.year || doc.first_publish_year;
      if (pubYear) {
        metaItems.push(`<div class="parchment-meta-item"><span class="meta-label">Published</span><span class="meta-val">${escapeHtml(String(pubYear))}</span></div>`);
      }
      const pageCount = doc.pages || doc.number_of_pages_median;
      if (pageCount) {
        metaItems.push(`<div class="parchment-meta-item"><span class="meta-label">Length</span><span class="meta-val">${escapeHtml(String(pageCount))} pp.</span></div>`);
      }
      const publisher = doc.publisher
        ? (Array.isArray(doc.publisher) ? escapeHtml(doc.publisher[0]) : escapeHtml(doc.publisher))
        : '';
      if (publisher) {
        metaItems.push(`<div class="parchment-meta-item"><span class="meta-label">Publisher</span><span class="meta-val">${publisher}</span></div>`);
      }
      const isbn = doc.isbn
        ? (Array.isArray(doc.isbn) ? escapeHtml(doc.isbn[0]) : escapeHtml(doc.isbn))
        : '';
      if (isbn) {
        metaItems.push(`<div class="parchment-meta-item"><span class="meta-label">ISBN</span><span class="meta-val">${isbn}</span></div>`);
      }

      const metaGridHtml = metaItems.length
        ? `<div class="parchment-meta-grid">${metaItems.join('')}</div>`
        : '';

      // Rating - ONLY when provided by a genuine source!
      const ratingAvg = doc.rating_avg || doc.ratings_average;
      let ratingHtml = '';
      if (ratingAvg && Number(ratingAvg) > 0) {
        const avg = Number(ratingAvg).toFixed(1);
        const ratingCount = doc.rating_count || doc.ratings_count;
        const countStr = ratingCount ? `(${formatRatingCount(ratingCount)} ratings)` : '';
        const fullStars = Math.round(Number(ratingAvg));
        const starsStr = '★'.repeat(Math.min(5, fullStars)) + '☆'.repeat(Math.max(0, 5 - fullStars));
        ratingHtml = `
          <div class="parchment-rating-row">
            <span class="parchment-stars" aria-label="${avg} out of 5 stars">${starsStr}</span>
            <span class="parchment-rating-score">${avg} / 5</span>
            ${countStr ? `<span class="parchment-rating-count">${countStr}</span>` : ''}
          </div>
        `;
      }

      // Archival Synopsis / Description
      let synopsisText = '';
      if (doc.description && doc.description.trim()) {
        synopsisText = escapeHtml(doc.description.slice(0, 280));
        if (doc.description.length > 280) synopsisText += '…';
      } else if (subjects.length > 0) {
        synopsisText = `An archival work encompassing ${escapeHtml(subjects.slice(0, 2).join(' and '))}. Recorded within the library catalog.`;
      } else {
        synopsisText = `A recorded volume preserved within the archives of BookVerse.`;
      }

      // Archives link
      const archiveHref = doc.key && doc.key.startsWith('/works/OL')
        ? `https://openlibrary.org${escapeAttr(doc.key)}`
        : `https://www.google.com/search?q=${encodeURIComponent(doc.title + ' ' + (doc.author || '') + ' book')}`;

      return `
        <div class="parchment-card-inner">
          <button class="parchment-close-btn" aria-label="Close book details" onclick="window.hideFloatingBookPanel(event)">×</button>

          <div class="parchment-header">
            <span class="parchment-ornament">✦ ARCHIVAL RECORD ✦</span>
            <h3 class="parchment-title">${title}</h3>
            <p class="parchment-author">by ${author}</p>
          </div>

          <div class="parchment-divider" aria-hidden="true"><span>❖</span></div>

          ${subjectChipsHtml}

          ${metaGridHtml}

          ${ratingHtml}

          <div class="parchment-synopsis">
            <p class="synopsis-label">Archival Synopsis</p>
            <p class="synopsis-text" id="floating-synopsis-${escapeAttr(workKey)}">${synopsisText}</p>
          </div>

          <div class="parchment-actions">
            <button
              class="parchment-add-btn"
              id="add-btn-${escapeAttr(workKey)}"
              onclick="event.stopPropagation(); addToLibraryFromDoc('${escapeAttr(doc.key || '')}')"
              aria-label="Add ${title} to your personal library"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add to Library</span>
            </button>

            <a
              href="${archiveHref}"
              target="_blank"
              rel="noopener"
              class="parchment-archive-link"
              onclick="event.stopPropagation()"
              title="View full record in external archives"
            >
              <span>Archives</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      `;
    }

    function showPanelForStand(stand) {
      clearTimeout(hideTimer);
      const key = stand.getAttribute('data-key');
      const doc = discoverResultsMap[key];
      if (!doc) return;

      activeKey = key;
      panel.innerHTML = renderPanelContent(doc);

      // Viewport-aware positioning relative to .enchanted-bookshelf-wrapper
      const wrapperRect = wrapper.getBoundingClientRect();
      const standRect = stand.getBoundingClientRect();
      const panelWidth = Math.min(340, window.innerWidth - 32);

      // Check available space on the right of the book
      const spaceRight = wrapperRect.right - standRect.right;
      const isPlaceLeft = (spaceRight < (panelWidth + 24)) || ((standRect.left - wrapperRect.left) > (wrapperRect.width * 0.58));

      let left = isPlaceLeft
        ? (standRect.left - wrapperRect.left - panelWidth - 16)
        : (standRect.right - wrapperRect.left + 16);

      // Keep within wrapper boundaries
      if (left < 10) left = 10;
      if (left + panelWidth > wrapperRect.width - 10) {
        left = wrapperRect.width - panelWidth - 10;
      }

      // Center vertically with the hovered book stand
      const bookCenterY = (standRect.top - wrapperRect.top) + (standRect.height / 2);
      let top = bookCenterY;

      // Vertical clamping so the card is never cut off
      const estimatedHeight = 360;
      if (top - (estimatedHeight / 2) < 20) {
        top = (estimatedHeight / 2) + 20;
      } else if (top + (estimatedHeight / 2) > wrapperRect.height - 20) {
        top = wrapperRect.height - (estimatedHeight / 2) - 20;
      }

      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.classList.add('visible');
      panel.setAttribute('aria-hidden', 'false');

      // Smooth background lazy-loading of full synopsis for Open Library works
      const workKey = (doc.key || '').replace('/works/', '').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (key.startsWith('/works/OL') && !workDescriptionsCache[key]) {
        fetch(`https://openlibrary.org${key}.json`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data) return;
            let desc = typeof data.description === 'string'
              ? data.description
              : (data.description && data.description.value ? data.description.value : '');
            if (desc) {
              desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\r?\n|\r/g, ' ').trim();
              if (desc.length > 280) desc = desc.slice(0, 277) + '…';
              workDescriptionsCache[key] = desc;
              const descEl = document.getElementById(`floating-synopsis-${workKey}`);
              if (descEl) descEl.textContent = desc;
            }
          })
          .catch(() => {});
      }
    }

    function hidePanel() {
      clearTimeout(hideTimer);
      panel.classList.remove('visible');
      panel.setAttribute('aria-hidden', 'true');
      activeKey = null;
    }
    window.hideFloatingBookPanel = hidePanel;

    stands.forEach(stand => {
      // Desktop hover interaction
      stand.addEventListener('mouseenter', () => {
        showPanelForStand(stand);
      });

      stand.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(hidePanel, 240);
      });

      // Mobile / touch tap interaction
      stand.addEventListener('click', e => {
        const key = stand.getAttribute('data-key');
        if (panel.classList.contains('visible') && activeKey === key) {
          hidePanel();
        } else {
          showPanelForStand(stand);
        }
      });
    });

    // Zero flicker: keep panel visible while cursor is inside it
    panel.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
    });

    panel.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(hidePanel, 200);
    });

    // Dismiss when clicking outside
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !e.target.closest('.shelf-book-stand')) {
        hidePanel();
      }
    });
  }

  /* ── Background description fetcher on hover ── */
  function initShelfHoverListeners() {
    const stands = document.querySelectorAll('.shelf-book-stand');
    stands.forEach(stand => {
      stand.addEventListener('mouseenter', async () => {
        const key = stand.getAttribute('data-key');
        const workKey = stand.getAttribute('data-work-key');
        if (!key || !workKey) return;

        // If synopsis already has content from backend, no fetch needed
        const currentEl = document.getElementById(`synopsis-${workKey}`);
        if (currentEl && currentEl.textContent && !currentEl.textContent.includes('Hovering over this tome')) {
          return;
        }

        if (workDescriptionsCache[key]) {
          const el = document.getElementById(`synopsis-${workKey}`);
          if (el && workDescriptionsCache[key] !== 'none') {
            el.textContent = workDescriptionsCache[key];
          }
          return;
        }

        if (!key.startsWith('/works/OL')) return;

        try {
          const res = await fetch(`https://openlibrary.org${key}.json`);
          if (res.ok) {
            const data = await res.json();
            let desc = '';
            if (typeof data.description === 'string') {
              desc = data.description;
            } else if (data.description && data.description.value) {
              desc = data.description.value;
            }
            if (desc) {
              // Clean up markdown links or excessive whitespace
              desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\r?\n|\r/g, ' ').trim();
              if (desc.length > 280) desc = desc.slice(0, 277) + '…';
              workDescriptionsCache[key] = desc;
              const el = document.getElementById(`synopsis-${workKey}`);
              if (el) el.textContent = desc;
              return;
            }
          }
          workDescriptionsCache[key] = 'none';
        } catch (e) {
          workDescriptionsCache[key] = 'none';
        }
      }, { once: true });
    });
  }

  function formatRatingCount(n) {
    if (!n) return '';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(0) + 'K';
    return String(n);
  }

  /* ── Open Library work detail page ── */
  function openOLBook(olKey, title) {
    if (olKey) {
      if (olKey.startsWith('/works/OL')) {
        window.open(`https://openlibrary.org${olKey}`, '_blank', 'noopener');
      } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(title + ' book')}`, '_blank', 'noopener');
      }
    }
  }
  window.openOLBook = openOLBook;

  /* ── Add to Library via Backend REST API ── */
  async function addToLibraryFromDoc(docKey) {
    const doc = discoverResultsMap[docKey];
    if (!doc) return;

    const workKey = (docKey || '').replace('/works/', '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const btn = document.getElementById('add-btn-' + workKey);
    if (btn) {
      btn.innerHTML = `
        <div class="loading-ornament" style="width:12px;height:12px;border-width:2px;margin-right:6px;"></div>
        <span>Inscribing...</span>
      `;
      btn.disabled = true;
    }

    const coverUrl = (doc.cover && typeof doc.cover === 'string') 
      ? doc.cover 
      : (doc.cover_i ? `${OL_COVERS}${doc.cover_i}${OL_COVER_L}` : '');
    const author = doc.author || (doc.author_name && doc.author_name.length ? doc.author_name[0] : 'Unknown Author');
    const genre = doc.genre || (doc.subjects && doc.subjects.length ? doc.subjects[0] : (doc.subject && doc.subject.length ? doc.subject[0] : 'General'));
    const pages = doc.pages || doc.number_of_pages_median || null;
    const year = doc.year || doc.first_publish_year || null;
    const publisher = typeof doc.publisher === 'string' ? doc.publisher : (doc.publisher && doc.publisher.length ? doc.publisher[0] : null);
    const isbn = typeof doc.isbn === 'string' ? doc.isbn : (doc.isbn && doc.isbn.length ? doc.isbn[0] : null);

    try {
      const res = await fetch('/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: doc.title,
          author: author,
          cover: coverUrl,
          genre: genre,
          pages: pages,
          publication_year: year,
          publisher: publisher,
          isbn: isbn,
          status: 'want-to-read'
        })
      });

      const data = await res.json();
      if (data.success) {
        if (btn) {
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg><span>In Your Library</span>`;
          btn.classList.add('added');
          btn.disabled = true;
        }

        // Show toast confirmation
        showDashboardToast(`Added "${doc.title}" to your library!`);

        // Refresh local user reading list and personal library
        await loadUserBooks();
      } else {
        if (btn) {
          btn.innerHTML = `<span>+ Add to Library</span>`;
          btn.disabled = false;
        }
        showDashboardToast(data.error || 'Failed to add book');
      }
    } catch (err) {
      console.error('Error adding book to library:', err);
      if (btn) {
        btn.innerHTML = `<span>+ Add to Library</span>`;
        btn.disabled = false;
      }
      showDashboardToast('Network error adding book to library');
    }
  }
  window.addToLibraryFromDoc = addToLibraryFromDoc;
  window.addToLibraryFromAPI = addToLibraryFromDoc;

  function showDashboardToast(msg) {
    let toast = document.getElementById('dashboard-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dashboard-toast';
      toast.className = 'bookverse-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>❧</span> <span>${escapeHtml(msg)}</span>`;
    toast.classList.add('show');
    clearTimeout(window._dashToastTimer);
    window._dashToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3400);
  }

  /* ============================================================
     7. DISCOVER SEARCH EVENT WIRING
     ============================================================ */
  function initDiscoverSearch() {
    const input = document.getElementById('discover-search-input');
    const btn   = document.getElementById('discover-search-btn');

    if (!input || !btn) return;

    // Click search button
    btn.addEventListener('click', () => {
      const q = input.value.trim();
      if (q) searchOpenLibrary(q);
    });

    // Enter key
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) searchOpenLibrary(q);
      }
    });

    // Genre chip buttons
    const chips = document.querySelectorAll('.genre-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const q = chip.dataset.query || chip.textContent.trim();
        activeChipQuery = q;
        input.value = '';
        searchOpenLibrary(q);
      });
    });
  }

  /* ============================================================
     8. HEADER SEARCH (filters local user library)
     ============================================================ */
  function initHeaderSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
          renderUserSections();
          return;
        }
        const filtered = userBooksData.filter(b =>
          (b.title  || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q) ||
          (b.genre  || '').toLowerCase().includes(q)
        );
        const container = document.getElementById('recently-added-container');
        if (!container) return;
        if (filtered.length === 0) {
          container.innerHTML = `
            <div class="empty-reading-state" style="grid-column:1/-1">
              <p class="empty-state-text">No books matching "${escapeHtml(q)}" in your library.</p>
            </div>
          `;
        } else {
          container.innerHTML = filtered.map(b => buildLocalBookCard(b)).join('');
        }
      }, 280);
    });
  }

  /* ============================================================
     9. READING SCHEDULE — weekly calendar
     ============================================================ */
  function initSchedule() {
    const container = document.getElementById('schedule-days');
    if (!container) return;

    const today   = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Reading targets are placeholder suggestions — not hardcoded user data
    const targets  = [25, 30, 30, 25, 30, 40, 35];
    let html = '';

    for (let i = 0; i < 7; i++) {
      const d       = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      html += `
        <div class="day-card${isToday ? ' today' : ''}"
             role="listitem"
             aria-label="${dayNames[d.getDay()]} ${d.getDate()}${isToday ? ' — Today' : ''}">
          <div class="day-name">${dayNames[d.getDay()]}</div>
          <div class="day-number">${d.getDate()}</div>
          <div class="day-target">${targets[i]} pp.</div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  /* ============================================================
     10. TIME-BASED GREETING
     ============================================================ */
  function setGreeting() {
    const el   = document.getElementById('user-greeting');
    if (!el) return;
    // Preserve the canonical "Welcome Back, Reader" heading
    el.textContent = 'Welcome Back, Reader';
  }

  /* ============================================================
     11. SAFETY HELPERS
     ============================================================ */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  /* ============================================================
     12. INITIALISE
     ============================================================ */
  function init() {
    setGreeting();
    initSchedule();
    initHeaderSearch();
    initDiscoverSearch();

    // Load user data then immediately fetch discover content
    loadUserBooks().then(() => {
      // Load the default genre after user data is ready
      searchOpenLibrary(activeChipQuery, 16);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================================
   GLOBAL UTILITY FUNCTIONS (called from inline event handlers)
   ============================================================ */

/** Navigate to book detail page (local book) */
function viewBook(bookId) {
  window.location.href = `/book?id=${encodeURIComponent(bookId)}`;
}

/** Continue reading — same as view */
function continueReading(bookId) {
  window.location.href = `/book?id=${encodeURIComponent(bookId)}`;
}
