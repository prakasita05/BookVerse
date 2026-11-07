/**
 * BookVerse — Library Page JavaScript
 * library.js
 */

(function () {
  'use strict';

  let booksData = [];
  let currentFilter = 'all';

  /* ====================================================
     LOAD BOOKS DATA
     ==================================================== */
  async function loadBooks() {
    try {
      const response = await fetch('/static/data/books.json');
      if (!response.ok) {
        throw new Error('Failed to load books data');
      }
      const data = await response.json();
      booksData = data.books || [];
      console.log('Books loaded:', booksData.length);
      renderLibrary();
    } catch (error) {
      console.error('Error loading books:', error);
      booksData = [];
      renderLibrary();
    }
  }

  /* ====================================================
     RENDER LIBRARY
     ==================================================== */
  function renderLibrary() {
    const container = document.getElementById('library-books-container');
    if (!container) return;

    let filteredBooks = booksData;
    
    // Note: Filtering by status will be implemented once
    // we integrate with UserBook database table
    // For now, show all books from global catalog

    if (filteredBooks.length === 0) {
      container.innerHTML = `
        <div style="
          text-align: center;
          padding: 80px;
          color: #999;
          grid-column: 1 / -1;
        ">
          <div style="font-size: 64px; margin-bottom: 16px;">📚</div>
          <h3 style="
            font-family: var(--font-serif);
            font-size: 24px;
            margin-bottom: 8px;
            color: #555;
          ">Your library is waiting</h3>
          <p style="margin-bottom: 24px;">
            Discover books from the catalog and start building your personal collection.
          </p>
          <a href="/add-book" style="
            display: inline-block;
            padding: 12px 24px;
            background: var(--forest-muted);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
          ">Explore Book Catalog</a>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
  }

  /* ====================================================
     CREATE BOOK CARD
     ==================================================== */
  function createBookCard(book) {
    // Note: progress and status removed from global catalog
    // Will be added back once UserBook database integration is complete
    
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
     SEARCH FUNCTIONALITY
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

      const filteredBooks = booksData.filter(book => {
        return book.title.toLowerCase().includes(query) ||
               book.author.toLowerCase().includes(query) ||
               book.genre.toLowerCase().includes(query);
      });

      if (filteredBooks.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 80px; color: #999; grid-column: 1 / -1;">
            <p>No books found matching "${query}"</p>
          </div>
        `;
      } else {
        container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
      }
    });
  }

  /* ====================================================
     INITIALIZE
     ==================================================== */
  function init() {
    console.log('BookVerse Library Initializing...');
    loadBooks();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose filter function globally
  window.filterLibrary = function(filter) {
    currentFilter = filter;
    renderLibrary();
  };

  // Expose viewBook function globally
  window.viewBook = function(bookId) {
    console.log('Viewing book:', bookId);
    window.location.href = `/book?id=${bookId}`;
  };

})();
