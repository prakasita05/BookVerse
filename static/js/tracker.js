/* ============================================================
   BOOKVERSE — READING TRACKER JAVASCRIPT
   Minimal, reliable reading companion with zero emojis
   ============================================================ */

(function () {
  'use strict';

  let currentGoalData = null;

  document.addEventListener('DOMContentLoaded', () => {
    loadTrackerData();
  });

  // ============================================================
  // 1. LOAD TRACKER DATA FROM BACKEND
  // ============================================================
  async function loadTrackerData() {
    try {
      const res = await fetch('/api/tracker/data');
      if (!res.ok) throw new Error('Failed to load tracker data');
      const data = await res.json();

      if (!data.success) {
        showToast('Unable to load reading tracker data');
        return;
      }

      currentGoalData = data.stats.goal;
      renderStats(data.stats);
      renderCurrentlyReading(data.currently_reading || []);
      renderCompletedBooks(data.completed_books || []);
      renderHistory(data.history || []);
    } catch (err) {
      console.error('Tracker error:', err);
      const container = document.getElementById('currently-reading-container');
      if (container) {
        container.innerHTML = '<p class="tracker-loading" style="color:#c94a4a;">Error loading reading records from archive.</p>';
      }
    }
  }

  // ============================================================
  // 2. RENDER STATISTICS & GOAL
  // ============================================================
  function renderStats(stats) {
    const elCompleted = document.getElementById('stat-books-completed');
    const elPages = document.getElementById('stat-pages-read');
    const elReading = document.getElementById('stat-currently-reading');
    const elGoalProgress = document.getElementById('stat-goal-progress');
    const elGoalSubtext = document.getElementById('stat-goal-subtext');
    const heroGoalBtnText = document.getElementById('hero-goal-btn-text');

    if (elCompleted) elCompleted.textContent = stats.books_completed || 0;
    if (elPages) elPages.textContent = (stats.pages_read || 0).toLocaleString();
    if (elReading) elReading.textContent = stats.currently_reading_count || 0;

    const goal = stats.goal;
    const goalContainer = document.getElementById('goal-display-container');
    if (goal && goalContainer) {
      const periodLabel = goal.period === 'monthly' ? 'month' : 'year';
      if (heroGoalBtnText) heroGoalBtnText.textContent = 'Edit Reading Goal';
      
      goalContainer.innerHTML = `
        <div class="stat-value">${goal.completed} / ${goal.target_books}</div>
        <div class="stat-subtext">${goal.progress_pct}% of ${periodLabel} target</div>
        <div class="goal-progress-wrap">
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${goal.progress_pct}%;"></div>
          </div>
        </div>
      `;
    } else if (goalContainer) {
      if (heroGoalBtnText) heroGoalBtnText.textContent = 'Set Reading Goal';
      goalContainer.innerHTML = `
        <div class="stat-value">Not Set</div>
        <div class="stat-subtext">Click to set a personal reading target</div>
      `;
    }
  }

  // ============================================================
  // 3. RENDER CURRENTLY READING BOOKS
  // ============================================================
  function renderCurrentlyReading(books) {
    const container = document.getElementById('currently-reading-container');
    const emptyState = document.getElementById('currently-reading-empty');
    const badge = document.getElementById('reading-badge-count');

    if (badge) {
      badge.textContent = books.length === 1 ? '1 Volume Active' : `${books.length} Volumes Active`;
    }

    if (!books || books.length === 0) {
      if (container) container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (container) container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = books.map(book => {
      const cover = book.cover || 'https://via.placeholder.com/95x140/2b1a0e/B69A63?text=BookVerse';
      const progress = book.progress || 0;
      const totalPages = book.pages || 0;
      const currentPage = book.current_page || 0;

      return `
        <div class="reading-tracker-card" id="reading-card-${book.book_id}">
          <div class="card-cover-box">
            <img 
              src="${escapeAttr(cover)}" 
              alt="${escapeHtml(book.title)}" 
              class="card-cover-img"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/95x140/2b1a0e/B69A63?text=BookVerse'"
            >
          </div>
          <div class="card-info-box">
            <div>
              <div class="card-book-genre">${escapeHtml(book.genre)}</div>
              <h3 class="card-book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
              <p class="card-book-author">by ${escapeHtml(book.author)}</p>

              <div class="card-progress-label">
                <span>Progress</span>
                <span id="pct-label-${book.book_id}">${progress}%</span>
              </div>
              <div class="card-progress-bar">
                <div class="card-progress-fill" id="fill-bar-${book.book_id}" style="width: ${progress}%;"></div>
              </div>

              <div class="page-update-form">
                <div class="page-input-wrapper">
                  <span>Page</span>
                  <input 
                    type="number" 
                    id="page-input-${book.book_id}" 
                    value="${currentPage}" 
                    min="0" 
                    max="${totalPages || 9999}" 
                    class="input-page-num"
                    onkeydown="if(event.key==='Enter'){updateBookPage(${book.book_id}, ${totalPages}); event.preventDefault();}"
                  >
                  <span>of ${totalPages > 0 ? totalPages : '—'}</span>
                </div>
                <button type="button" class="btn-update-page" onclick="updateBookPage(${book.book_id}, ${totalPages})">
                  Update
                </button>
              </div>
            </div>

            <div class="card-bottom-actions">
              <button 
                type="button" 
                class="btn-mark-complete-tracker" 
                onclick="markBookCompleted(${book.book_id}, '${escapeAttr(book.title)}')"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Mark Completed</span>
              </button>
              <a href="/book?id=${book.book_id}" class="btn-view-volume">
                View Volume
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // 4. RENDER COMPLETED BOOKS
  // ============================================================
  function renderCompletedBooks(books) {
    const container = document.getElementById('completed-books-container');
    const emptyState = document.getElementById('completed-empty');
    const badge = document.getElementById('completed-badge-count');

    if (badge) {
      badge.textContent = books.length === 1 ? '1 Completed Volume' : `${books.length} Completed Volumes`;
    }

    if (!books || books.length === 0) {
      if (container) container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (container) container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = books.map(book => {
      const cover = book.cover || 'https://via.placeholder.com/65x95/2b1a0e/B69A63?text=BookVerse';
      const pagesText = book.pages ? `${book.pages} pp.` : '';

      return `
        <div class="completed-book-card">
          <div class="completed-cover-box">
            <img 
              src="${escapeAttr(cover)}" 
              alt="${escapeHtml(book.title)}" 
              class="completed-cover-img"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/65x95/2b1a0e/B69A63?text=BookVerse'"
            >
          </div>
          <div class="completed-info-box">
            <div>
              <h4 class="completed-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h4>
              <p class="completed-author">by ${escapeHtml(book.author)}</p>
            </div>
            <div class="completed-meta-row">
              <span class="completed-date-tag">Finished: ${escapeHtml(book.date_finished)}</span>
              ${pagesText ? `<span style="color:#A89582;">${pagesText}</span>` : ''}
            </div>
            <div style="margin-top: 8px;">
              <a href="/book?id=${book.book_id}" class="btn-view-volume" style="display:inline-block; padding: 4px 8px; font-size:11px;">
                View Notes & Review
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // 5. RENDER READING HISTORY
  // ============================================================
  function renderHistory(items) {
    const list = document.getElementById('history-list');
    const section = document.getElementById('reading-history-section');
    if (!list) return;

    if (!items || items.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';

    list.innerHTML = items.map(item => {
      const isCompleted = item.type === 'completed';
      const tagClass = isCompleted ? 'tag-completed' : 'tag-reading';
      const tagText = isCompleted ? 'Completed' : 'Reading';

      return `
        <div class="history-item">
          <div class="history-left">
            <span class="history-tag ${tagClass}">${tagText}</span>
            <div>
              <span class="history-title">${escapeHtml(item.title)}</span>
              <span class="history-author"> by ${escapeHtml(item.author)}</span>
            </div>
          </div>
          <div class="history-date">${escapeHtml(item.date)}</div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // 6. UPDATE CURRENT PAGE INTERACTION
  // ============================================================
  async function updateBookPage(bookId, totalPages) {
    const input = document.getElementById(`page-input-${bookId}`);
    if (!input) return;

    const pageVal = parseInt(input.value) || 0;
    const clampedPage = Math.max(0, totalPages > 0 ? Math.min(pageVal, totalPages) : pageVal);
    input.value = clampedPage;

    const pct = totalPages > 0 ? Math.min(100, Math.round((clampedPage / totalPages) * 100)) : 0;
    const newStatus = (pct >= 100 && totalPages > 0) ? 'completed' : 'reading';

    try {
      const res = await fetch('/api/user/books/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          current_page: clampedPage,
          progress: pct,
          status: newStatus
        })
      });

      const data = await res.json();
      if (data.success) {
        if (newStatus === 'completed') {
          showToast('Volume completed! Inscribed to your completed collection.');
          loadTrackerData();
        } else {
          // Update card DOM
          const pctLabel = document.getElementById(`pct-label-${bookId}`);
          const fillBar = document.getElementById(`fill-bar-${bookId}`);
          if (pctLabel) pctLabel.textContent = `${pct}%`;
          if (fillBar) fillBar.style.width = `${pct}%`;
          showToast(`Progress saved: Page ${clampedPage} of ${totalPages} (${pct}%)`);
          // Reload data in background to update total pages read stat
          fetch('/api/tracker/data').then(r => r.json()).then(d => {
            if (d.success) renderStats(d.stats);
          });
        }
      } else {
        showToast(data.error || 'Failed to update reading page');
      }
    } catch (err) {
      console.error('Error updating page:', err);
      showToast('Network error saving progress');
    }
  }
  window.updateBookPage = updateBookPage;

  // ============================================================
  // 7. MARK AS COMPLETED INTERACTION
  // ============================================================
  async function markBookCompleted(bookId, bookTitle) {
    try {
      const res = await fetch('/api/user/books/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          status: 'completed'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`"${bookTitle}" marked as completed! Inscribed in your ledger.`);
        loadTrackerData();
      } else {
        showToast(data.error || 'Failed to mark book as completed');
      }
    } catch (err) {
      console.error('Error completing book:', err);
      showToast('Network error updating completion');
    }
  }
  window.markBookCompleted = markBookCompleted;

  // ============================================================
  // 8. GOAL MODAL MANAGEMENT
  // ============================================================
  function openGoalModal() {
    const modal = document.getElementById('goal-modal-backdrop');
    const targetInput = document.getElementById('goal-target-input');
    const periodSelect = document.getElementById('goal-period-select');

    if (currentGoalData) {
      if (targetInput) targetInput.value = currentGoalData.target_books || '';
      if (periodSelect) periodSelect.value = currentGoalData.period || 'yearly';
    } else {
      if (targetInput) targetInput.value = '';
      if (periodSelect) periodSelect.value = 'yearly';
    }

    if (modal) modal.classList.add('active');
  }
  window.openGoalModal = openGoalModal;

  function closeGoalModal(e) {
    if (e && e.target && e.target.id !== 'goal-modal-backdrop' && !e.target.classList.contains('modal-close-btn') && !e.target.classList.contains('btn-cancel-modal')) {
      return;
    }
    const modal = document.getElementById('goal-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }
  window.closeGoalModal = closeGoalModal;

  async function handleGoalSubmit(e) {
    e.preventDefault();
    const targetInput = document.getElementById('goal-target-input');
    const periodSelect = document.getElementById('goal-period-select');

    const targetVal = parseInt(targetInput ? targetInput.value : 0) || 0;
    const periodVal = periodSelect ? periodSelect.value : 'yearly';

    if (targetVal <= 0) {
      showToast('Please specify a target greater than zero');
      return;
    }

    try {
      const res = await fetch('/api/tracker/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_books: targetVal,
          period: periodVal
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Reading goal saved');
        closeGoalModal();
        loadTrackerData();
      } else {
        showToast(data.error || 'Failed to save goal');
      }
    } catch (err) {
      console.error('Error saving goal:', err);
      showToast('Network error saving goal');
    }
  }
  window.handleGoalSubmit = handleGoalSubmit;

  async function clearReadingGoal() {
    try {
      const res = await fetch('/api/tracker/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_books: 0 })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Reading goal cleared');
        closeGoalModal();
        loadTrackerData();
      }
    } catch (err) {
      console.error('Error clearing goal:', err);
      showToast('Network error clearing goal');
    }
  }
  window.clearReadingGoal = clearReadingGoal;

  // ============================================================
  // 9. TOAST NOTIFICATION HELPER
  // ============================================================
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('tracker-toast');
    if (!toast) return;

    toast.textContent = msg;
    toast.style.display = 'block';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }

  // ============================================================
  // 10. UTILITY ESCAPING
  // ============================================================
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

})();

