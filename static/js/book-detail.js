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
  let currentUserId = null; // Will be set from authenticated session
  let selectedRating = 0;

  /* ====================================================
     1. LOAD BOOK DETAILS
     ==================================================== */
  async function loadBookDetails() {
    try {
      // Get book ID from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = parseInt(urlParams.get('id'));

      if (!bookId) {
        console.error('No book ID provided');
        return;
      }

      // Load books data
      const booksResponse = await fetch('/static/data/books.json');
      const booksData = await booksResponse.json();
      currentBook = booksData.books.find(book => book.id === bookId);

      if (!currentBook) {
        console.error('Book not found');
        return;
      }

      // Render book details
      renderBookDetails();

      // Load reviews
      await loadReviews(bookId);

    } catch (error) {
      console.error('Error loading book details:', error);
    }
  }

  /* ====================================================
     2. RENDER BOOK DETAILS
     ==================================================== */
  function renderBookDetails() {
    if (!currentBook) return;

    document.getElementById('book-cover').src = currentBook.cover;
    document.getElementById('book-title').textContent = currentBook.title;
    document.getElementById('book-author').textContent = `by ${currentBook.author}`;
    document.getElementById('book-genre').textContent = currentBook.genre;
    document.getElementById('book-pages').textContent = `${currentBook.pages} pages`;
    document.getElementById('book-description').textContent = currentBook.description;

    // Update page title
    document.title = `${currentBook.title} — BookVerse`;

    // Note: Reading progress will be shown once UserBook database is integrated
    // For now, hide the progress section
    const progressSection = document.getElementById('reading-progress-section');
    if (progressSection) {
      progressSection.style.display = 'none';
    }
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
            <span class="icon">${review.liked ? '♥' : '♡'}</span>
            <span>${review.likes} ${review.likes === 1 ? 'like' : 'likes'}</span>
          </button>
          
          <button class="review-action-btn" onclick="toggleComments(${review.id})">
            <span class="icon">💬</span>
            <span>${reviewComments.length} ${reviewComments.length === 1 ? 'reply' : 'replies'}</span>
          </button>

          ${isOwnReview ? `
            <div class="review-edit-menu">
              <button class="review-action-btn" onclick="editReview(${review.id})">
                <span class="icon">✏️</span>
                <span>Edit</span>
              </button>
            </div>
            <button class="review-action-btn" onclick="deleteReview(${review.id})">
              <span class="icon">🗑️</span>
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

// Book actions
function startReading() {
  console.log('Start reading');
  alert('Reading interface coming soon!');
}

function addToShelf() {
  console.log('Add to shelf');
  alert('Shelf management coming soon!');
}

function toggleWishlist() {
  console.log('Toggle wishlist');
  alert('Wishlist functionality coming soon!');
}
