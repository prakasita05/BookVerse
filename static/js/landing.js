/**
 * BookVerse — Video Hero Landing Page Engine
 * landing.js
 */

(function () {
  'use strict';

  /* ====================================================
     1. BACKGROUND VIDEO LOAD & AUTOPLAY HANDLER
     ==================================================== */
  const video = document.getElementById('bg-video');
  const poster = document.getElementById('video-poster');

  if (video) {
    const revealVideo = () => {
      video.classList.add('loaded');
      if (poster) {
        poster.style.transition = 'opacity 1.2s ease-in-out';
        poster.style.opacity = '0';
      }
    };

    const tryPlay = () => {
      video.muted = true;
      video.play().then(() => {
        revealVideo();
      }).catch(() => {
        // Fallback: reveal even if browser delays autoplay
        revealVideo();
      });
    };

    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener('canplaythrough', tryPlay, { once: true });
      video.addEventListener('playing', revealVideo, { once: true });
      // Safety timeout after 1.5s
      setTimeout(tryPlay, 1500);
    }
  }


  /* ====================================================
     2. AMBIENT GOLD DUST PARTICLE CANVAS
     ==================================================== */
  const canvas = document.getElementById('dust-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    function createDustParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.22 + 0.04,
        hue: Math.random() > 0.5 ? 42 : 36,
        sat: 45 + Math.random() * 25,
        lit: 58 + Math.random() * 22,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -(Math.random() * 0.18 + 0.04),
        life: 1.0,
        decay: Math.random() * 0.0006 + 0.0002,
      };
    }

    const particles = Array.from({ length: 45 }, createDustParticle);

    function renderDust() {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p, i) => {
        p.x += p.vx + Math.sin(Date.now() * 0.0003 + i) * 0.05;
        p.y += p.vy;
        p.life -= p.decay;

        const topFade = Math.min(p.y / 70, 1);
        const currentAlpha = p.alpha * p.life * topFade;

        if (p.life <= 0 || p.y < -10) {
          Object.assign(p, createDustParticle());
          p.y = H + 10;
        }

        if (currentAlpha < 0.005) return;

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, ${p.sat}%, ${p.lit}%)`;
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(renderDust);
    }

    requestAnimationFrame(renderDust);
  }


  /* ====================================================
     3. ENTER BUTTON — CINEMATIC PAGE TRANSITION
     ==================================================== */
  const enterBtn = document.getElementById('enter-btn');
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.transition = 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = enterBtn.getAttribute('href');
      }, 500);
    });
  }

})();
