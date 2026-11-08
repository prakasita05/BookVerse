/* ============================================================
   BOOKVERSE — READING MUSIC JAVASCRIPT
   Spotify reading soundscapes with zero emojis
   ============================================================ */

(function () {
  'use strict';

  let currentMoodId = 'deep-focus';

  const MOOD_ICONS = {
    'enchanted-fantasy': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    `,
    'dark-academia': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `,
    'deep-focus': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `,
    'romantic-reading': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `,
    'mystery-suspense': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `,
    'sci-fi-reading': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <line x1="3.6" y1="9" x2="20.4" y2="9"></line>
        <line x1="3.6" y1="15" x2="20.4" y2="15"></line>
      </svg>
    `,
    'cozy-reading': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
        <line x1="6" y1="1" x2="6" y2="4"></line>
        <line x1="10" y1="1" x2="10" y2="4"></line>
        <line x1="14" y1="1" x2="14" y2="4"></line>
      </svg>
    `,
    'nature-rain': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="16" y1="13" x2="16" y2="21"></line>
        <line x1="8" y1="13" x2="8" y2="21"></line>
        <line x1="12" y1="15" x2="12" y2="23"></line>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
      </svg>
    `
  };

  document.addEventListener('DOMContentLoaded', () => {
    initMusicPage();
  });

  async function initMusicPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const genreParam = urlParams.get('genre') || '';
    const bookIdParam = urlParams.get('book_id') || '';
    const titleParam = urlParams.get('title') || '';

    try {
      const query = new URLSearchParams();
      if (genreParam) query.set('genre', genreParam);
      if (bookIdParam) query.set('book_id', bookIdParam);

      const res = await fetch(`/api/reading-music/recommend?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        renderMoods(data.all_moods, data.recommended_mood ? data.recommended_mood.id : 'deep-focus');

        if (genreParam || bookIdParam) {
          showRecommendationBanner(data.recommended_mood, titleParam, genreParam);
          selectMood(data.recommended_mood);
        } else {
          // Select default Deep Focus
          const defaultMood = data.all_moods.find(m => m.id === 'deep-focus') || data.all_moods[0];
          selectMood(defaultMood);
        }
      }
    } catch (err) {
      console.error('Error fetching music data:', err);
    }
  }

  function showRecommendationBanner(mood, bookTitle, genre) {
    const banner = document.getElementById('music-rec-banner');
    if (!banner) return;

    const iconHtml = MOOD_ICONS[mood.id] || MOOD_ICONS['deep-focus'];
    const titleStr = bookTitle ? `"${bookTitle}"` : 'Your Volume';
    const genreStr = genre ? `(${genre})` : '';

    banner.innerHTML = `
      <div class="music-rec-info">
        <div class="music-rec-icon">${iconHtml}</div>
        <div class="music-rec-text">
          <span>Curated atmosphere for </span>
          <strong class="music-rec-title">${escapeHtml(titleStr)}</strong>
          <span> ${escapeHtml(genreStr)} &rarr; Recommended companion: </span>
          <strong style="color: #8C6F3E;">${escapeHtml(mood.title)}</strong>
        </div>
      </div>
      <button type="button" class="btn-start-read" style="padding: 7px 14px; font-size: 13px;" onclick="scrollToMood('${escapeAttr(mood.id)}')">
        <span>Focus Atmosphere</span>
      </button>
    `;
    banner.style.display = 'flex';
  }

  function renderMoods(moods, activeId) {
    const grid = document.getElementById('reading-moods-grid');
    if (!grid) return;

    grid.innerHTML = moods.map(mood => {
      const isActive = mood.id === activeId;
      const icon = MOOD_ICONS[mood.id] || MOOD_ICONS['deep-focus'];
      const genreTags = (mood.genres || []).slice(0, 3).map(g => `<span class="mood-genre-pill">${escapeHtml(g)}</span>`).join('');

      return `
        <div class="mood-card ${isActive ? 'active-mood' : ''}" id="mood-card-${escapeAttr(mood.id)}">
          <div>
            <div class="mood-card-header">
              <div class="mood-card-icon">${icon}</div>
              <h3 class="mood-card-title">${escapeHtml(mood.title)}</h3>
            </div>
            <p class="mood-card-desc">${escapeHtml(mood.description)}</p>
            <div class="mood-card-genres">${genreTags}</div>
          </div>

          <div class="mood-card-actions">
            <button 
              type="button" 
              class="btn-mood-play"
              onclick="handleMoodSelect('${escapeAttr(mood.id)}', '${escapeAttr(mood.title)}', '${escapeAttr(mood.embed_url)}', '${escapeAttr(mood.spotify_url)}')"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Play Atmosphere</span>
            </button>
            <a 
              href="${escapeAttr(mood.spotify_url)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn-mood-spotify" 
              title="Open full playlist in Spotify"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.745 3.808-.87 7.076-.51 9.722 1.112.294.18.386.563.207.857zm1.224-2.724c-.226.367-.707.482-1.074.256-2.69-1.653-6.79-2.133-9.97-1.168-.413.125-.851-.107-.976-.52-.125-.413.107-.851.52-.976 3.633-1.103 8.147-.568 11.244 1.334.367.226.482.707.256 1.074zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.02-.133-1.17-.627-.15-.494.133-1.02.627-1.17 3.535-1.073 9.404-.87 13.115 1.333.444.264.59.84.327 1.284-.264.444-.84.59-1.284.327z"/>
              </svg>
              <span>Spotify</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  function selectMood(mood) {
    if (!mood) return;
    currentMoodId = mood.id;

    // Update active card class
    document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active-mood'));
    const card = document.getElementById(`mood-card-${mood.id}`);
    if (card) card.classList.add('active-mood');

    // Update Player Dock
    const titleEl = document.getElementById('player-dock-current-title');
    const iframeEl = document.getElementById('spotify-embed-iframe');
    const spotifyDirectLink = document.getElementById('player-spotify-link');

    if (titleEl) {
      titleEl.innerHTML = `
        <span style="display:inline-flex; align-items:center; margin-right:8px; color:#8C6F3E;">
          ${MOOD_ICONS[mood.id] || MOOD_ICONS['deep-focus']}
        </span>
        <span>${escapeHtml(mood.title)}</span>
      `;
    }

    if (iframeEl && mood.embed_url) {
      iframeEl.src = mood.embed_url;
    }

    if (spotifyDirectLink && mood.spotify_url) {
      spotifyDirectLink.href = mood.spotify_url;
    }
  }

  function handleMoodSelect(id, title, embedUrl, spotifyUrl) {
    selectMood({ id, title, embed_url: embedUrl, spotify_url: spotifyUrl });
    // Smooth scroll to player dock
    const dock = document.getElementById('music-player-dock');
    if (dock) {
      dock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  window.handleMoodSelect = handleMoodSelect;

  function scrollToMood(moodId) {
    const card = document.getElementById(`mood-card-${moodId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  window.scrollToMood = scrollToMood;

  // Genre dropdown listener
  window.handleGenrePickerChange = function (genre) {
    if (!genre) return;
    window.location.href = `/reading-music?genre=${encodeURIComponent(genre)}`;
  };

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

