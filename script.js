// ===== MOBILE VIDEO AUTOPLAY FIX =====
// iOS Safari is strict about autoplay. Try to start each video as soon as it's
// ready, and retry on first touch/scroll if iOS blocked the initial attempt.
(function() {
  const tryPlay = (v) => {
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {/* iOS will play once user interacts */});
    }
  };

  const initVideos = () => {
    document.querySelectorAll('video').forEach(v => {
      // Belt-and-braces: ensure all the attributes iOS needs
      v.muted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.playsInline = true;
      tryPlay(v);
      // If video pauses for any reason, try playing again next frame
      v.addEventListener('pause', () => {
        if (!v.ended) requestAnimationFrame(() => tryPlay(v));
      });
    });
  };

  // Run as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideos);
  } else {
    initVideos();
  }

  // Retry on first interaction (iOS unblocks autoplay after user gesture)
  const retryAll = () => {
    document.querySelectorAll('video').forEach(tryPlay);
  };
  ['touchstart', 'scroll', 'click'].forEach(ev => {
    window.addEventListener(ev, retryAll, { once: true, passive: true });
  });
})();

(function() {
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  if (!cursor || !dot) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }
  animate();

  const hoverables = 'a, button, .thumb, .thumb-single, [onclick], input, textarea, select, label';
  document.querySelectorAll(hoverables).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('click'));
  document.addEventListener('mouseup', () => cursor.classList.remove('click'));
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    dot.style.opacity = cursor.classList.contains('hover') ? '0' : '1';
  });
})();

function showPage(name, scrollTo) {
  // Multi-page navigation: route to the correct page.
  const pageMap = { 'home': 'index.html', 'software': 'index.html', 'design': 'design.html', 'about': 'about.html', 'quote': 'quote.html' };
  const target = pageMap[name] || 'index.html';
  if (scrollTo) {
    window.location.href = target + '#' + scrollTo;
  } else {
    window.location.href = target;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('quoteForm');
  const success = document.getElementById('quoteSuccess');
  const submitBtn = form.querySelector('.form-submit');
  const emailField = document.getElementById('q-email');
  const replyto = document.getElementById('q-replyto');
  if (emailField && replyto) replyto.value = emailField.value;

  const originalLabel = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  submitBtn.innerHTML = 'Sending…';

  // If Formspree endpoint hasn't been configured, fall back to mailto
  // (this lets the form still "work" even without backend signup)
  const formActionUrl = form.action || '';
  const isPlaceholder = !formActionUrl.includes('formspree.io');

  if (isPlaceholder) {
    // Build a pre-filled mailto with all the form data
    const data = new FormData(form);
    const subject = encodeURIComponent('New project brief — Interface');
    const body = encodeURIComponent(
      `Name: ${data.get('name') || ''}\n` +
      `Email: ${data.get('email') || ''}\n` +
      `Company: ${data.get('company') || '—'}\n` +
      `Project type: ${data.get('project_type') || '—'}\n` +
      `Budget: ${data.get('budget') || '—'}\n` +
      `Timeline: ${data.get('timeline') || '—'}\n\n` +
      `Project details:\n${data.get('message') || ''}\n`
    );
    window.location.href = `mailto:info@interfacecardiff.com?subject=${subject}&body=${body}`;

    // Show success state after a short delay
    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.reset();
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.innerHTML = originalLabel;
    }, 800);
    return;
  }

  // Real Formspree submission
  try {
    const response = await fetch(form.action, {
      method: 'POST', body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.reset();
    } else {
      const data = await response.json().catch(() => ({}));
      const msg = (data.errors && data.errors.map(e => e.message).join(', ')) || 'Something went wrong. Please email us directly at info@interfacecardiff.com';
      alert(msg);
      submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
    }
  } catch (err) {
    alert('Network error. Please email us directly at info@interfacecardiff.com');
    submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
  }
}

async function handleWaitlistSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('waitlistForm');
  const success = document.getElementById('waitlistSuccess');
  const submitBtn = form.querySelector('.form-submit');
  const emailField = document.getElementById('w-email');
  const replyto = document.getElementById('w-replyto');
  if (emailField && replyto) replyto.value = emailField.value;

  const originalLabel = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  submitBtn.innerHTML = 'Joining…';

  // If Formspree endpoint hasn't been configured, fall back to mailto
  const formActionUrl = form.action || '';
  const isPlaceholder = !formActionUrl.includes('formspree.io');

  if (isPlaceholder) {
    const data = new FormData(form);
    const subject = encodeURIComponent('Interface OS waitlist signup');
    const body = encodeURIComponent(
      `Name: ${data.get('name') || ''}\n` +
      `Email: ${data.get('email') || ''}\n` +
      `Brand / company: ${data.get('company') || '—'}\n`
    );
    window.location.href = `mailto:info@interfacecardiff.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.reset();
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.innerHTML = originalLabel;
    }, 800);
    return;
  }

  try {
    const response = await fetch(form.action, {
      method: 'POST', body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.reset();
    } else {
      const data = await response.json().catch(() => ({}));
      const msg = (data.errors && data.errors.map(e => e.message).join(', ')) || 'Something went wrong. Please email us directly at info@interfacecardiff.com';
      alert(msg);
      submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
    }
  } catch (err) {
    alert('Network error. Please email us directly at info@interfacecardiff.com');
    submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
  }
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('projectForm');
  const success = document.getElementById('projectSuccess');
  const submitBtn = document.getElementById('configSubmit');
  const emailField = document.getElementById('p-email');
  const replyto = document.getElementById('p-replyto');
  if (emailField && replyto) replyto.value = emailField.value;

  const originalLabel = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  submitBtn.innerHTML = 'Sending…';

  const formActionUrl = form.action || '';
  const isPlaceholder = !formActionUrl.includes('formspree.io');

  if (isPlaceholder) {
    const data = new FormData(form);
    const subject = encodeURIComponent('New project enquiry — Interface');
    const body = encodeURIComponent(
      `Looking for: ${data.get('looking_for') || ''}\n` +
      `Business: ${data.get('business') || ''}\n` +
      `What it does: ${data.get('what_it_does') || ''}\n` +
      `Trying to improve: ${data.get('improve') || ''}\n` +
      `Current site: ${data.get('current_url') || '—'}\n` +
      `Budget: ${data.get('budget') || ''}\n\n` +
      `Name: ${data.get('name') || ''}\n` +
      `Email: ${data.get('email') || ''}\n` +
      `Phone: ${data.get('phone') || '—'}\n\n` +
      `Notes:\n${data.get('message') || ''}\n`
    );
    window.location.href = `mailto:info@interfacecardiff.com?subject=${subject}&body=${body}`;
    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
    }, 800);
    return;
  }

  try {
    const response = await fetch(form.action, {
      method: 'POST', body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      form.style.display = 'none';
      success.classList.add('shown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const data = await response.json().catch(() => ({}));
      const msg = (data.errors && data.errors.map(e => e.message).join(', ')) || 'Something went wrong. Please email us directly at info@interfacecardiff.com';
      alert(msg);
      submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
    }
  } catch (err) {
    alert('Network error. Please email us directly at info@interfacecardiff.com');
    submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalLabel;
  }
}


// ===== CONTACT — project configurator (4-step wizard) =====
(function () {
  const form = document.getElementById('projectForm');
  if (!form) return;

  const steps = Array.from(document.querySelectorAll('.config-step'));
  const panels = Array.from(document.querySelectorAll('.config-panel'));
  const backBtn = document.getElementById('configBack');
  const nextBtn = document.getElementById('configNext');
  const submitBtn = document.getElementById('configSubmit');
  const TOTAL = panels.length;
  let current = 1;

  const lookingFor = new Set();
  let budget = '';

  // step 1 — multi-select chips
  document.querySelectorAll('.config-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const v = chip.dataset.value;
      if (lookingFor.has(v)) { lookingFor.delete(v); chip.classList.remove('is-selected'); }
      else { lookingFor.add(v); chip.classList.add('is-selected'); }
      document.getElementById('p-looking-for').value = Array.from(lookingFor).join(', ');
    });
  });

  // step 3 — single-select budget
  document.querySelectorAll('.config-budget-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      budget = opt.dataset.value;
      document.querySelectorAll('.config-budget-opt').forEach(o => o.classList.remove('is-selected'));
      opt.classList.add('is-selected');
      document.getElementById('p-budget').value = budget;
    });
  });

  function validate(n) {
    if (n === 1) return lookingFor.size > 0;
    if (n === 3) return !!budget;
    const panel = panels.find(p => Number(p.dataset.panel) === n);
    const fields = panel.querySelectorAll('[required]');
    for (const f of fields) { if (!f.checkValidity()) { f.reportValidity(); return false; } }
    return true;
  }

  function render() {
    panels.forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === current));
    steps.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle('is-active', n === current);
      s.classList.toggle('is-done', n < current);
      s.disabled = n > current;
    });
    backBtn.classList.toggle('is-visible', current > 1);
    const isLast = current === TOTAL;
    nextBtn.style.display = isLast ? 'none' : 'inline-flex';
    submitBtn.style.display = isLast ? 'inline-flex' : 'none';
  }

  nextBtn.addEventListener('click', () => {
    if (!validate(current)) return;
    if (current < TOTAL) { current++; render(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  backBtn.addEventListener('click', () => {
    if (current > 1) { current--; render(); }
  });
  steps.forEach(s => {
    s.addEventListener('click', () => {
      const n = Number(s.dataset.step);
      if (n < current) { current = n; render(); }
    });
  });

  // Enter key advances instead of submitting early, except on the final step.
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA') return;
    if (current < TOTAL) { e.preventDefault(); nextBtn.click(); }
  });

  render();
})();


// ===== PRICING — plan selector + Individual/Team toggle =====
// Software page only; every other page loads this same script.js, so
// everything here is guarded behind the section actually existing.
(function () {
  const grid = document.getElementById('pricingGrid');
  if (!grid) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cards = Array.from(grid.querySelectorAll('.pricing-card'));
  const convertTitle = document.getElementById('convertTitle');
  const convertSub = document.getElementById('convertSub');
  const convertBtnLabel = document.getElementById('convertBtnLabel');
  const wSubject = document.getElementById('w-subject');
  const wPlan = document.getElementById('w-plan');

  function swapText(el, text) {
    if (!el) return;
    if (reduceMotion) { el.textContent = text; return; }
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = text; el.style.opacity = '1'; }, 150);
  }

  function selectCard(card) {
    const btn = card.querySelector('.pricing-card-hit');
    if (!btn || card.classList.contains('is-selected')) return;

    cards.forEach(c => {
      c.classList.remove('is-selected');
      const b = c.querySelector('.pricing-card-hit');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    card.classList.add('is-selected');
    btn.setAttribute('aria-expanded', 'true');

    const plan = card.dataset.plan || '';
    swapText(convertTitle, btn.dataset.convertTitle || '');
    swapText(convertSub, btn.dataset.convertSub || '');
    swapText(convertBtnLabel, btn.dataset.convertCta || '');
    if (wSubject) wSubject.value = btn.dataset.subject || '';
    if (wPlan) wPlan.value = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : '';
  }

  cards.forEach(card => {
    const btn = card.querySelector('.pricing-card-hit');
    if (btn) btn.addEventListener('click', () => selectCard(card));
  });

  // Individual / Team toggle — sliding pill, no invented Team pricing;
  // this only tracks UI state for now.
  const toggle = document.querySelector('.pricing-toggle');
  if (toggle) {
    const toggleBtns = Array.from(toggle.querySelectorAll('button'));
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('on');
        btn.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('data-active', btn.dataset.toggle || 'individual');
      });
    });
  }
})();


// ===== LOADING SCREEN =====
// The actual JARVIS app's own loading screen (see
// intro-screen-export/README.md): a percentage counter, 0% to 100% over
// 1.6s with an ease-out cubic curve — no progress bar, the number itself is
// the loading beat. Clicking anywhere skips straight to the end, same as
// the original. Adapted from the export only to keep this site's existing
// fade-out (.hidden + delayed remove()) and body.loading/cursor handling,
// both unrelated to the loader's own visuals.
(function () {
  const wake = document.getElementById('wake');
  const pctEl = document.getElementById('wakePct');
  if (!wake || !pctEl) return;

  // This is a plain multi-page site, not a single-page app — every internal
  // link is a full page load, which would otherwise replay the full 1.6s
  // intro on every click. sessionStorage marks it as already seen for this
  // browser tab, so it's the very first page of a visit that gets the
  // intro; clicking around after that skips straight through with no
  // flash, no delay. A fresh tab (or the flag being unreadable — private
  // browsing in some browsers throws on sessionStorage access) plays it
  // again, which is the correct fallback: better to show it once too often
  // than never.
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem('interfaceIntroShown') === '1'; } catch (e) {}

  if (alreadySeen) {
    wake.remove();
    document.body.classList.remove('loading');
    return;
  }

  const DURATION_MS = 1600;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('interfaceIntroShown', '1'); } catch (e) {}
    wake.classList.add('hidden');
    document.body.classList.remove('loading');
    setTimeout(() => wake.remove(), 900);
  }

  wake.addEventListener('click', finish, { once: true });

  const start = performance.now();
  function tick(now) {
    if (done) return;
    const t = Math.min(1, (now - start) / DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic — settles rather than snapping
    pctEl.textContent = Math.round(eased * 100) + '%';
    if (t < 1) { requestAnimationFrame(tick); return; }
    finish();
  }
  requestAnimationFrame(tick);
})();


// ===== STUDIO HOMEPAGE — decision cards, FAQ accordion, hero parallax =====
// Guarded behind each section actually existing, since every page shares
// this same script.js.
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // "What are you looking to build?" cards — one open at a time.
  const decisionCards = document.querySelectorAll('.decision-card');
  if (decisionCards.length) {
    decisionCards.forEach(card => {
      const btn = card.querySelector('.decision-card-hit');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const willOpen = !card.classList.contains('is-open');
        decisionCards.forEach(c => {
          c.classList.remove('is-open');
          const b = c.querySelector('.decision-card-hit');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) { card.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  // FAQ accordion — independent, multiple can be open.
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  // Hero visual — a tiny scroll parallax, nothing scroll-jacky.
  const heroMedia = document.getElementById('studioHeroMedia');
  if (heroMedia && !reduceMotion) {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const shift = Math.min(window.scrollY * 0.06, 24);
        heroMedia.style.transform = 'translate3d(0,' + shift + 'px,0)';
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }


  // Hero video — a subtle cursor-tracked tilt, desktop pointer only.
  if (heroVideo && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const wrap = document.getElementById('studioHeroMedia');
    wrap.style.perspective = '1000px';
    wrap.addEventListener('mousemove', (e) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      heroVideo.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
    });
    wrap.addEventListener('mouseleave', () => { heroVideo.style.transform = ''; });
  }

  // Scroll-reveal — sections fade/translate up into place the first time
  // they enter view. Skipped entirely for reduced-motion (content is
  // simply visible from load).
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll(
      '.decision, .services, .journey, .work, .compare, .offer, .os-teaser, .faq, .final-cta, .approach'
    );
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => { el.classList.add('reveal-init'); io.observe(el); });
  }
})();