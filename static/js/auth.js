/**
 * BookVerse — Authentication Page JS
 * auth.js
 */

(function () {
  'use strict';

  // 1. Tab Switching Handler
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const groupName = document.getElementById('group-name');
  const submitBtn = document.getElementById('submit-btn');

  if (tabLogin && tabSignup) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabSignup.setAttribute('aria-selected', 'false');

      if (groupName) groupName.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Enter the Library';
    });

    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      tabSignup.setAttribute('aria-selected', 'true');
      tabLogin.setAttribute('aria-selected', 'false');

      if (groupName) groupName.style.display = 'flex';
      if (submitBtn) submitBtn.textContent = 'Create Account & Enter';
    });
  }

  // 2. Ambient Dust Particle System
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

})();
