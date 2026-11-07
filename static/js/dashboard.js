/**
 * BookVerse — Main Dashboard JavaScript
 * dashboard.js
 */

(function () {
  'use strict';

  /* ====================================================
     1. LOAD BOOK DATA FROM JSON
     ==================================================== */
  let booksData = [];

  async function loadBooks() {
    try {
      const response = await fetch('/static/data/books.json');
      if (!response.ok) {
        throw new Error('Failed to load books data');
      }
      const data = await response.json();
      booksData = data.books || [];
      console.log('Books loaded:', booksData.length);
      renderDashboard();
    } catch (error) {
      console.error('Error loading books:', error);
      // Fallback to empty array if data fails to load
      booksData = [];
      renderDashboard();
    }
  }

  /* ====================================================
     2. RENDER DASHBOARD SECTIONS WITH USER DATA
     ==================================================== */
  function renderDashboard() {
    calculateAndDisplayStats();
    renderCurrentlyReading();
    renderPopularBooks();
    renderRecentlyAdded();
  }

  /* ====================================================
     3. CALCULATE REAL USER STATISTICS
     ==================================================== */
  function calculateAndDisplayStats() {
    // Calculate stats based on actual user data from books.json
    const readBooks = booksData.filter(book => book.status === 'completed');
    const currentlyReading = booksData.filter(book => book.status === 'reading');
    const wantToRead = booksData.filter(book => book.status === 'want-to-read');
    
    // Calculate total pages read from completed books
    const totalPagesRead = readBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
    
    // In a real application, these would come from user activity data
    const dayStreak = 0; // Placeholder - would track consecutive reading days
    const savedQuotes = 0; // Placeholder - would count user's saved quotes
    
    // Update stat displays
    updateStatDisplay('stat-books-read', readBooks.length);
    updateStatDisplay('stat-currently-reading', currentlyReading.length);
    updateStatDisplay('stat-want-to-read', wantToRead.length);
    updateStatDisplay('stat-day-streak', dayStreak);
    updateStatDisplay('stat-pages-read', totalPagesRead);
    updateStatDisplay('stat-saved-quotes', savedQuotes);
  }

  function updateStatDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  /* ====================================================
     4. RENDER CURRENTLY READING BOOKS
     ==================================================== */
  function renderCurrentlyReading() {
    const container = document.getElementById('currently-reading-container');
    if (!container) return;

    const readingBooks = booksData.filter(book => book.status === 'reading');

    // Show tasteful empty state if no books
    if (readingBooks.length === 0) {
      container.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 32px;
          background: 
            linear-gradient(145deg, 
              rgba(255, 255, 255, 0.6), 
              rgba(255, 255, 255, 0.4));
          backdrop-filter: blur(8px);
          border-radius: 18px;
          border: 1px solid rgba(61, 90, 64, 0.10);
          box-shadow: 0 4px 20px rgba(13, 22, 15, 0.06);
        ">
          <div style="font-size: 56px; margin-bottom: 20px; opacity: 0.2;">📖</div>
          <h3 style="
            font-family: var(--font-serif);
            font-size: 26px;
            font-weight: 400;
            color: var(--forest-deep);
            margin-bottom: 14px;
            letter-spacing: 0.01em;
          ">Begin your reading journey</h3>
          <p style="
            color: var(--olive-muted); 
            margin-bottom: 28px; 
            max-width: 440px; 
            margin-left: auto; 
            margin-right: auto;
            line-height: 1.7;
            font-size: 15px;
          ">
            Your personal library awaits. Start tracking your literary adventures
            and discover the stories that will shape your world.
          </p>
          <a href="/library" style="
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, var(--forest-rich), var(--moss-deep));
            color: var(--parchment-ivory);
            text-decoration: none;
            border-radius: 12px;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 16px rgba(45, 68, 52, 0.25);
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 24px rgba(45, 68, 52, 0.32)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(45, 68, 52, 0.25)'">
            Explore Books
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = readingBooks.map(book => `
      <div class="reading-card" data-book-id="${book.id}">
        <img src="${book.cover}" 
             alt="${book.title}" 
             class="reading-cover"
             onerror="this.src='https://via.placeholder.com/110x165?text=No+Cover'">
        <div class="reading-details">
          <div>
            <h3 class="reading-title">${book.title}</h3>
            <p class="reading-author">by ${book.author}</p>
          </div>
          <div>
            <div class="reading-progress">
              <div class="progress-label">
                <span>Reading Progress</span>
                <span>${book.progress}%</span>
              </div>
              <div class="reading-progress-bar">
                <div class="reading-progress-fill" style="width: ${book.progress}%"></div>
              </div>
            </div>
            <p class="reading-pages">${Math.round(book.pages * book.progress / 100)} of ${book.pages} pages</p>
            <button class="continue-btn" onclick="continueReading(${book.id})">
              Continue Reading →
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ====================================================
     5. RENDER POPULAR/RECOMMENDED BOOKS
     ==================================================== */
  function renderPopularBooks() {
    const container = document.getElementById('popular-books-container');
    if (!container) return;

    // Get all books from global catalog (no status filter)
    const popularBooks = booksData.slice(0, 6);

    if (popularBooks.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.2;">📚</div>
          <p style="color: var(--olive-muted);">The catalogue is being curated.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = popularBooks.map(book => createBookCard(book)).join('');
  }

  /* ====================================================
     5. RENDER RECENTLY ADDED BOOKS
     ==================================================== */
  function renderRecentlyAdded() {
    const container = document.getElementById('recently-added-container');
    if (!container) return;

    // Show last 6 books from catalog
    const recentBooks = booksData.slice(-6).reverse();

    // Show empty state if no books
    if (recentBooks.length === 0) {
      container.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 24px;
        ">
          <p style="color: #999;">No books available yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recentBooks.map(book => createBookCard(book)).join('');
  }

  /* ====================================================
     6. CREATE BOOK CARD HTML
     ==================================================== */
  function createBookCard(book) {
    // Note: progress and status are removed from global catalog
    // These will come from UserBook table once database is integrated
    
    return `
      <div class="book-card" data-book-id="${book.id}" onclick="viewBook(${book.id})">
        <div class="book-cover-wrapper">
          <img src="${book.cover}" 
               alt="${book.title}" 
               class="book-cover"
               onerror="this.src='https://via.placeholder.com/180x270?text=No+Cover'">
        </div>
        <div class="book-info">
          <h4 class="book-title">${book.title}</h4>
          <p class="book-author">${book.author}</p>
          <div class="book-meta">
            <span class="book-genre">${book.genre}</span>
            <span>${book.pages} pages</span>
          </div>
        </div>
      </div>
    `;
  }

  /* ====================================================
     7. SEARCH FUNCTIONALITY
     ==================================================== */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase().trim();
      
      if (query === '') {
        renderDashboard();
        return;
      }

      const filteredBooks = booksData.filter(book => {
        return book.title.toLowerCase().includes(query) ||
               book.author.toLowerCase().includes(query) ||
               book.genre.toLowerCase().includes(query);
      });

      // Show search results in popular books section
      const container = document.getElementById('popular-books-container');
      if (container) {
        if (filteredBooks.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 48px; color: #999;">
              <p>No books found matching "${query}"</p>
            </div>
          `;
        } else {
          container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
        }
      }
    });
  }

  /* ====================================================
     8. READING SCHEDULE / CALENDAR
     ==================================================== */
  function initializeSchedule() {
    const scheduleContainer = document.getElementById('schedule-days');
    if (!scheduleContainer) return;

    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targets = [20, 30, 30, 25, 30, 40, 35]; // pages per day

    let html = '';
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const isToday = i === 0;
      
      html += `
        <div class="day-card ${isToday ? 'today' : ''}" data-day="${i}">
          <div class="day-name">${days[date.getDay()]}</div>
          <div class="day-number">${date.getDate()}</div>
          <div class="day-target">${targets[i]} pages</div>
        </div>
      `;
    }
    
    scheduleContainer.innerHTML = html;
  }

  /* ====================================================
     9. USER GREETING WITH TIME-BASED MESSAGE
     ==================================================== */
  function setGreeting() {
    const greetingElement = document.getElementById('user-greeting');
    if (!greetingElement) return;

    const hour = new Date().getHours();
    let greeting = 'Welcome to BookVerse';
    
    if (hour < 12) {
      greeting = 'Good Morning, Reader';
    } else if (hour < 17) {
      greeting = 'Welcome Back, Reader';
    } else if (hour < 22) {
      greeting = 'Good Evening, Reader';
    } else {
      greeting = 'Reading by Moonlight';
    }
    
    greetingElement.textContent = greeting;
  }

  /* ====================================================
     10. INITIALIZE DASHBOARD
     ==================================================== */
  function init() {
    console.log('BookVerse Dashboard Initializing...');
    setGreeting();
    initializeSchedule();
    loadBooks();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ====================================================
   GLOBAL UTILITY FUNCTIONS
   ==================================================== */
function viewBook(bookId) {
  console.log('Viewing book:', bookId);
  window.location.href = `/book?id=${bookId}`;
}

function continueReading(bookId) {
  console.log('Continue reading book:', bookId);
  window.location.href = `/book?id=${bookId}`;
}
