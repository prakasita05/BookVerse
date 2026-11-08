/**
 * BookVerse — Book Detail & Review System
 * book-detail.js
 */

(function () {
  'use strict';

  let currentBook = null;
  let allReviews = [];
  let allComments = [];
  let currentSort = 'newest';
  let currentUserId = null;
  let selectedRating = 0;
  let selectedShelfId = null;

  /* ====================================================
     1. LOAD BOOK DETAILS (FROM BACKEND DB API)
     ==================================================== */
  async function loadBookDetails() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = parseInt(urlParams.get('id'));

      if (!bookId) {
        console.error('No book ID provided');
        showBookNotFound('No book selected. Please return to the library.');
        return;
      }

      // Fetch from Flask REST API
      const response = await fetch(`/api/books/${bookId}`);
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      currentBook = data.book;

      if (!currentBook) {
        showBookNotFound('Book not found in archive.');
        return;
      }

      // Render book details and user personal state
      renderBookDetails(data);

      // Render reviews
      allReviews = data.reviews || [];
      updateRatingDisplay(data.rating_avg || 0, data.rating_count || 0);
      renderReviews();

    } catch (error) {
      console.warn('API fetch failed, trying local fallback:', error);
      // Fallback for static assets
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = parseInt(urlParams.get('id'));
        const booksResponse = await fetch('/static/data/books.json');
        const booksData = await booksResponse.json();
        currentBook = booksData.books.find(book => book.id === bookId);
        if (currentBook) {
          renderBookDetails({ book: currentBook });
          updateRatingDisplay(0, 0);
          renderReviews();
          return;
        }
      } catch (e) {
        console.error(e);
      }
      showBookNotFound('Unable to load book details.');
    }
  }

  function showBookNotFound(msg) {
    const main = document.querySelector('.dashboard-main');
    if (main) {
      main.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="font-family: var(--font-serif); font-size: 32px; color: var(--forest-deep); margin-bottom: 12px;">Book Not Found</h2>
          <p style="color: #666; margin-bottom: 24px;">${msg}</p>
          <a href="/library" class="btn-primary" style="display: inline-block;">Return to My Library</a>
        </div>
      `;
    }
  }

  /* ====================================================
     2. RENDER BOOK DETAILS & PERSONAL STATE
     ==================================================== */
  function renderBookDetails(data) {
    if (!currentBook) return;

    const coverEl = document.getElementById('book-cover');
    if (coverEl) {
      coverEl.src = currentBook.cover || '';
      coverEl.alt = `Cover of ${currentBook.title || 'Book'}`;
    }

    const titleEl = document.getElementById('book-title');
    if (titleEl) titleEl.textContent = currentBook.title || 'Untitled';

    const authorEl = document.getElementById('book-author');
    if (authorEl) authorEl.textContent = `by ${currentBook.author || 'Unknown Author'}`;

    const genreEl = document.getElementById('book-genre');
    if (genreEl) genreEl.textContent = currentBook.genre || 'General';

    const pagesEl = document.getElementById('book-pages');
    if (pagesEl) pagesEl.textContent = currentBook.pages ? `${currentBook.pages} pages` : '— pages';

    const descEl = document.getElementById('book-description');
    if (descEl) descEl.textContent = currentBook.description || 'No description available for this edition.';

    document.title = `${currentBook.title || 'Book Details'} — BookVerse`;

    // Personal user reading state
    const userStatus = data ? data.user_status : null;
    const userProgress = data ? (data.user_progress || 0) : 0;
    const userCurrentPage = data ? (data.user_current_page || 0) : 0;
    const userShelves = data && data.user_shelves ? data.user_shelves : [];

    const progressSection = document.getElementById('reading-progress-section');
    const readingText = document.getElementById('btn-reading-text');
    const shelfText = document.getElementById('btn-shelf-text');
    const shelfBtn = document.getElementById('btn-add-to-shelf');
    const wishlistText = document.getElementById('btn-wishlist-text');
    const wishlistBtn = document.getElementById('btn-wishlist');

    // Currently Reading
    if (userStatus === 'reading') {
      if (progressSection) progressSection.style.display = 'block';
      if (readingText) readingText.textContent = 'Currently Reading';
      updateProgressDisplay(userCurrentPage, userProgress);
    } else if (userStatus === 'completed') {
      if (progressSection) progressSection.style.display = 'block';
      if (readingText) readingText.textContent = 'Completed';
      updateProgressDisplay(currentBook.pages || userCurrentPage, 100);
    } else {
      if (progressSection) progressSection.style.display = 'none';
      if (readingText) readingText.textContent = 'Start Reading';
    }

    // Shelf Button State
    if (userShelves.length > 0) {
      if (shelfText) shelfText.textContent = `On Shelf: ${userShelves[0]}`;
      if (shelfBtn) shelfBtn.classList.add('active-shelf');
    } else {
      if (shelfText) shelfText.textContent = 'Add to Shelf';
      if (shelfBtn) shelfBtn.classList.remove('active-shelf');
    }

    // Wishlist Button State
    if (userStatus === 'want-to-read') {
      if (wishlistText) wishlistText.textContent = 'In Wishlist';
      if (wishlistBtn) wishlistBtn.classList.add('in-wishlist');
    } else {
      if (wishlistText) wishlistText.textContent = 'Wishlist';
      if (wishlistBtn) wishlistBtn.classList.remove('in-wishlist');
    }
  }

  function updateProgressDisplay(currentPage, percentage) {
    const fill = document.getElementById('progress-fill');
    const pct = document.getElementById('progress-percentage');
    const pages = document.getElementById('progress-pages');
    const input = document.getElementById('input-current-page');

    if (fill) fill.style.width = `${percentage}%`;
    if (pct) pct.textContent = `${percentage}%`;
    if (pages) pages.textContent = `${currentPage} / ${currentBook.pages || '—'} pages`;
    if (input) input.value = currentPage;
  }

  /* ====================================================
     3. LOAD REVIEWS & COMMENTS
     ==================================================== */
  async function loadReviews(bookId) {
    try {
      // Reviews will come from database once authentication is implemented
      // For now, show empty state
      allReviews = [];
      allComments = [];

      // Show empty rating display
      updateRatingDisplay(0, 0);

      // Render empty state
      renderReviews();

    } catch (error) {
      console.error('Error loading reviews:', error);
      document.getElementById('reviews-list').innerHTML = 
        '<p class="loading-message">Failed to load reviews.</p>';
    }
  }

  /* ====================================================
     4. UPDATE RATING DISPLAY
     ==================================================== */
  function updateRatingDisplay(avgRating, count) {
    const starsElement = document.getElementById('rating-stars');
    const valueElement = document.getElementById('rating-value');
    const countElement = document.getElementById('rating-count');

    if (count === 0) {
      // No ratings yet
      starsElement.textContent = '☆☆☆☆☆';
      valueElement.textContent = '—';
      countElement.textContent = '(No ratings yet)';
      return;
    }

    // Generate star display
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHTML += '★';
      } else if (i === fullStars && hasHalfStar) {
        starsHTML += '★';
      } else {
        starsHTML += '☆';
      }
    }

    starsElement.textContent = starsHTML;
    valueElement.textContent = avgRating.toFixed(1);
    countElement.textContent = `(${count} ${count === 1 ? 'review' : 'reviews'})`;
  }

  /* ====================================================
     5. RENDER REVIEWS
     ==================================================== */
  function renderReviews() {
    const listContainer = document.getElementById('reviews-list');
    const emptyContainer = document.getElementById('reviews-empty');

    if (allReviews.length === 0) {
      listContainer.style.display = 'none';
      emptyContainer.style.display = 'block';
      return;
    }

    listContainer.style.display = 'flex';
    emptyContainer.style.display = 'none';

    // Sort reviews
    const sortedReviews = sortReviewsArray(allReviews, currentSort);

    listContainer.innerHTML = sortedReviews.map(review => createReviewCard(review)).join('');
  }

  /* ====================================================
     6. SORT REVIEWS
     ==================================================== */
  function sortReviewsArray(reviews, sortType) {
    const sorted = [...reviews];
    
    if (sortType === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortType === 'popular') {
      sorted.sort((a, b) => b.likes - a.likes);
    }
    
    return sorted;
  }

  /* ====================================================
     7. CREATE REVIEW CARD
     ==================================================== */
  function createReviewCard(review) {
    const isOwnReview = review.user_id === currentUserId;
    const reviewComments = allComments.filter(c => c.review_id === review.id);
    const formattedDate = formatDate(review.created_at);
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-header">
          <div class="review-author-info">
            <div class="review-avatar">${review.user_avatar}</div>
            <div class="review-author-details">
              <a href="#" class="review-author-name">${review.user_name}</a>
              <span class="review-date">${formattedDate}</span>
            </div>
          </div>
          <div class="review-rating">${stars}</div>
        </div>

        <div class="review-text">${review.review_text}</div>

        <div class="review-actions">
          <button class="review-action-btn ${review.liked ? 'liked' : ''}" onclick="toggleLike(${review.id})">
            <span class="icon" style="display:inline-flex; align-items:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${review.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </span>
            <span>${review.likes} ${review.likes === 1 ? 'like' : 'likes'}</span>
          </button>
          
          <button class="review-action-btn" onclick="toggleComments(${review.id})">
            <span class="icon" style="display:inline-flex; align-items:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </span>
            <span>${reviewComments.length} ${reviewComments.length === 1 ? 'reply' : 'replies'}</span>
          </button>

          ${isOwnReview ? `
            <div class="review-edit-menu">
              <button class="review-action-btn" onclick="editReview(${review.id})">
                <span class="icon" style="display:inline-flex; align-items:center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </span>
                <span>Edit</span>
              </button>
            </div>
            <button class="review-action-btn" onclick="deleteReview(${review.id})">
              <span class="icon" style="display:inline-flex; align-items:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </span>
              <span>Delete</span>
            </button>
          ` : ''}
        </div>

        ${reviewComments.length > 0 ? `
          <div class="comments-section" id="comments-${review.id}" style="display: none;">
            <div class="comments-list">
              ${reviewComments.map(comment => createCommentCard(comment)).join('')}
            </div>
            <div class="comment-form">
              <input type="text" 
                     class="comment-input" 
                     placeholder="Write a reply..." 
                     id="comment-input-${review.id}">
              <button class="comment-submit-btn" onclick="submitComment(${review.id})">
                Reply
              </button>
            </div>
          </div>
        ` : `
          <div class="comments-section" id="comments-${review.id}" style="display: none;">
            <div class="comment-form">
              <input type="text" 
                     class="comment-input" 
                     placeholder="Write a reply..." 
                     id="comment-input-${review.id}">
              <button class="comment-submit-btn" onclick="submitComment(${review.id})">
                Reply
              </button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  /* ====================================================
     8. CREATE COMMENT CARD
     ==================================================== */
  function createCommentCard(comment) {
    const formattedDate = formatDate(comment.created_at);

    return `
      <div class="comment-card">
        <div class="comment-avatar">${comment.user_avatar}</div>
        <div class="comment-content">
          <div class="comment-header">
            <a href="#" class="comment-author">${comment.user_name}</a>
            <span class="comment-date">${formattedDate}</span>
          </div>
          <div class="comment-text">${comment.comment_text}</div>
        </div>
      </div>
    `;
  }

  /* ====================================================
     9. FORMAT DATE
     ==================================================== */
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  /* ====================================================
     10. STAR RATING INPUT
     ==================================================== */
  function initializeStarRating() {
    const stars = document.querySelectorAll('.star-input');
    
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        document.getElementById('rating-value-input').value = selectedRating;
        
        // Update visual state
        stars.forEach((s, i) => {
          if (i < selectedRating) {
            s.textContent = '★';
            s.classList.add('active');
          } else {
            s.textContent = '☆';
            s.classList.remove('active');
          }
        });
      });

      star.addEventListener('mouseenter', () => {
        stars.forEach((s, i) => {
          s.textContent = i <= index ? '★' : '☆';
        });
      });
    });

    const ratingContainer = document.getElementById('star-rating-input');
    ratingContainer.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.textContent = i < selectedRating ? '★' : '☆';
      });
    });
  }

  /* ====================================================
     11. INITIALIZE
     ==================================================== */
  function init() {
    console.log('BookVerse Book Detail Initializing...');
    loadBookDetails();
    initializeStarRating();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ====================================================
   GLOBAL FUNCTIONS (called from HTML)
   ==================================================== */

// Show/hide review form
function showReviewForm() {
  document.getElementById('review-form-container').style.display = 'block';
  document.getElementById('review-text').focus();
}

function hideReviewForm() {
  document.getElementById('review-form-container').style.display = 'none';
  document.getElementById('review-form').reset();
}

// Submit review
function submitReview(event) {
  event.preventDefault();
  
  const rating = document.getElementById('rating-value-input').value;
  const reviewText = document.getElementById('review-text').value;

  if (!rating || !reviewText) {
    alert('Please provide both a rating and review text.');
    return;
  }

  console.log('Review submitted:', { rating, reviewText });
  
  // TODO: Send to backend
  alert('Review submitted successfully! (Backend integration coming soon)');
  
  hideReviewForm();
}

// Sort reviews
function sortReviews(sortType) {
  window.currentSort = sortType;
  
  // Update button states
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-sort') === sortType) {
      btn.classList.add('active');
    }
  });

  // Re-render reviews
  // This will be called by the main module
  location.reload(); // Temporary solution
}

// Toggle like
function toggleLike(reviewId) {
  console.log('Toggle like for review:', reviewId);
  // TODO: Implement like functionality
  alert('Like functionality coming soon!');
}

// Toggle comments visibility
function toggleComments(reviewId) {
  const commentsSection = document.getElementById(`comments-${reviewId}`);
  if (commentsSection) {
    const isVisible = commentsSection.style.display !== 'none';
    commentsSection.style.display = isVisible ? 'none' : 'block';
  }
}

// Submit comment
function submitComment(reviewId) {
  const input = document.getElementById(`comment-input-${reviewId}`);
  const commentText = input.value.trim();

  if (!commentText) {
    return;
  }

  console.log('Comment submitted:', { reviewId, commentText });
  
  // TODO: Send to backend
  alert('Comment posted! (Backend integration coming soon)');
  
  input.value = '';
}

// Edit review
function editReview(reviewId) {
  console.log('Edit review:', reviewId);
  // TODO: Implement edit functionality
  alert('Edit functionality coming soon!');
}

// Delete review
function deleteReview(reviewId) {
  if (confirm('Are you sure you want to delete this review?')) {
    console.log('Delete review:', reviewId);
    // TODO: Implement delete functionality
    alert('Delete functionality coming soon!');
  }
}

// ====================================================
// TOAST NOTIFICATION UTILITY
// ====================================================
function showToast(message, duration = 3200) {
  let toast = document.getElementById('bookverse-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bookverse-toast';
    toast.className = 'bookverse-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>❧</span> <span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ====================================================
// BOOK ACTIONS & BACKEND PERSISTENCE
// ====================================================

// 1. Reading Action (Start Reading / Toggle Status)
async function handleReadingAction() {
  if (!currentBook) return;

  try {
    const res = await fetch('/api/user/books/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: currentBook.id,
        status: 'reading'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Added "${currentBook.title}" to Currently Reading`);
      const progressSection = document.getElementById('reading-progress-section');
      if (progressSection) progressSection.style.display = 'block';
      const readingText = document.getElementById('btn-reading-text');
      if (readingText) readingText.textContent = 'Currently Reading';
      updateProgressDisplay(data.current_page || 0, data.progress || 0);
    } else {
      showToast(data.error || 'Failed to update reading status');
    }
  } catch (err) {
    console.error('Error starting reading:', err);
    showToast('Network error while updating reading status');
  }
}

// 2. Save Current Page Progress
async function savePageProgress() {
  if (!currentBook) return;
  const input = document.getElementById('input-current-page');
  const pageVal = parseInt(input ? input.value : 0) || 0;
  const totalPages = currentBook.pages || 1;
  const clampedPage = Math.min(pageVal, totalPages);
  const pct = Math.min(100, Math.round((clampedPage / totalPages) * 100));
  const newStatus = pct >= 100 ? 'completed' : 'reading';

  try {
    const res = await fetch('/api/user/books/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: currentBook.id,
        current_page: clampedPage,
        progress: pct,
        status: newStatus
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(newStatus === 'completed' ? `Congratulations! You finished "${currentBook.title}"!` : `Progress updated to page ${clampedPage} (${pct}%)`);
      updateProgressDisplay(clampedPage, pct);
      const readingText = document.getElementById('btn-reading-text');
      if (readingText) {
        readingText.textContent = newStatus === 'completed' ? 'Completed' : 'Currently Reading';
      }
    } else {
      showToast(data.error || 'Failed to update progress');
    }
  } catch (err) {
    console.error('Error saving progress:', err);
    showToast('Network error updating progress');
  }
}

// 3. Wishlist Action
async function toggleWishlist() {
  if (!currentBook) return;
  const wishlistBtn = document.getElementById('btn-wishlist');
  const isCurrentlyInWishlist = wishlistBtn && wishlistBtn.classList.contains('in-wishlist');
  const targetStatus = isCurrentlyInWishlist ? 'want-to-read' : 'want-to-read';

  try {
    const res = await fetch('/api/user/books/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: currentBook.id,
        status: targetStatus
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`"${currentBook.title}" saved to your Wishlist`);
      const wishlistText = document.getElementById('btn-wishlist-text');
      if (wishlistText) wishlistText.textContent = 'In Wishlist';
      if (wishlistBtn) wishlistBtn.classList.add('in-wishlist');
    } else {
      showToast(data.error || 'Failed to update wishlist');
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    showToast('Network error updating wishlist');
  }
}

// ====================================================
// SHELF MODAL INTERACTION
// ====================================================
async function openShelfModal() {
  if (!currentBook) return;
  const backdrop = document.getElementById('shelf-modal-backdrop');
  const bookTarget = document.getElementById('modal-book-title');
  if (bookTarget) {
    bookTarget.textContent = `Adding "${currentBook.title}" by ${currentBook.author}`;
  }

  if (backdrop) backdrop.classList.add('active');
  await loadUserShelvesForModal();
}

function closeShelfModal(e) {
  if (e && e.target && e.target.id !== 'shelf-modal-backdrop' && !e.target.classList.contains('shelf-modal-close') && !e.target.classList.contains('shelf-cancel-btn')) {
    return;
  }
  const backdrop = document.getElementById('shelf-modal-backdrop');
  if (backdrop) backdrop.classList.remove('active');
}

async function loadUserShelvesForModal() {
  const container = document.getElementById('modal-shelves-list');
  if (!container) return;

  container.innerHTML = '<p style="color:#87927B; font-size:13px; text-align:center;">Loading shelves...</p>';

  try {
    const res = await fetch('/api/user/shelves');
    const data = await res.json();
    const shelves = data.shelves || [];

    if (shelves.length === 0) {
      container.innerHTML = '<p style="color:#87927B; font-size:13px; text-align:center;">No custom shelves yet. Create one below!</p>';
      return;
    }

    container.innerHTML = shelves.map((shelf, idx) => `
      <div class="shelf-option-item ${idx === 0 ? 'selected' : ''}" 
           data-shelf-id="${shelf.id}" 
           data-shelf-name="${escapeHtml(shelf.name)}"
           onclick="selectShelfItem(this, ${shelf.id})">
        <div class="shelf-option-left">
          <input type="radio" name="shelf-radio" value="${shelf.id}" ${idx === 0 ? 'checked' : ''}>
          <span class="shelf-option-name">${escapeHtml(shelf.name)}</span>
        </div>
        <span class="shelf-option-count">${shelf.book_count} books</span>
      </div>
    `).join('');

    if (shelves.length > 0) {
      selectedShelfId = shelves[0].id;
    }
  } catch (err) {
    console.error('Failed to load shelves:', err);
    container.innerHTML = '<p style="color:#c94a4a; font-size:13px; text-align:center;">Failed to load shelves.</p>';
  }
}

function selectShelfItem(element, shelfId) {
  document.querySelectorAll('.shelf-option-item').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  const radio = element.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  selectedShelfId = shelfId;
}

async function createNewShelfInline() {
  const input = document.getElementById('new-shelf-input');
  const name = input ? input.value.trim() : '';
  if (!name) return;

  try {
    const res = await fetch('/api/user/shelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      await loadUserShelvesForModal();
      selectedShelfId = data.id;
      showToast(`Created shelf "${name}"`);
    } else {
      showToast(data.error || 'Failed to create shelf');
    }
  } catch (err) {
    console.error('Error creating shelf:', err);
    showToast('Network error creating shelf');
  }
}

async function confirmAddToShelf() {
  if (!currentBook) return;
  if (!selectedShelfId) {
    showToast('Please select a shelf first');
    return;
  }

  const selectedEl = document.querySelector(`.shelf-option-item[data-shelf-id="${selectedShelfId}"]`);
  const shelfName = selectedEl ? selectedEl.getAttribute('data-shelf-name') : 'Shelf';

  try {
    const res = await fetch('/api/user/shelves/add-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: currentBook.id,
        shelf_id: selectedShelfId
      })
    });

    const data = await res.json();
    if (data.success) {
      const backdrop = document.getElementById('shelf-modal-backdrop');
      if (backdrop) backdrop.classList.remove('active');

      const shelfText = document.getElementById('btn-shelf-text');
      const shelfBtn = document.getElementById('btn-add-to-shelf');
      if (shelfText) shelfText.textContent = `On Shelf: ${shelfName}`;
      if (shelfBtn) shelfBtn.classList.add('active-shelf');

      showToast(`Added "${currentBook.title}" to "${shelfName}"`);
    } else {
      showToast(data.error || 'Failed to add to shelf');
    }
  } catch (err) {
    console.error('Error adding book to shelf:', err);
    showToast('Network error adding to shelf');
  }
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

// Expose functions globally for onclick handlers
window.handleReadingAction = handleReadingAction;
window.startReading = handleReadingAction;
window.savePageProgress = savePageProgress;
window.toggleWishlist = toggleWishlist;
window.openShelfModal = openShelfModal;
window.addToShelf = openShelfModal;
window.closeShelfModal = closeShelfModal;
window.selectShelfItem = selectShelfItem;
window.createNewShelfInline = createNewShelfInline;
window.confirmAddToShelf = confirmAddToShelf;
window.showToast = showToast;
