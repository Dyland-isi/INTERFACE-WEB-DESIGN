/* ============================================================
   INTERFACE — PREVIEW SITE JS
   Tiny, no dependencies. Three jobs:
   1. Show the preview ribbon when ?preview=interface in URL
   2. Stamp the current year in the footer
   3. Smooth-scroll for in-page anchor links
   ============================================================ */

(function () {
  'use strict';

  // --- 1. PREVIEW RIBBON ----------------------------------------------------
  // Visible only with ?preview=interface — keeps the page production-ready
  // when handed over, but loud and clear when sent as a sales preview.
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === 'interface') {
    const ribbon = document.getElementById('previewRibbon');
    if (ribbon) {
      ribbon.hidden = false;
      document.body.classList.add('has-ribbon');
    }
  }

  // --- 2. YEAR --------------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- 3. SMOOTH SCROLL FOR ANCHORS ----------------------------------------
  // CSS `scroll-behavior: smooth` would do this, but the sticky header
  // offsets the target. This handles both cleanly.
  const header = document.querySelector('.site-head');
  const headerOffset = () => (header ? header.getBoundingClientRect().height : 0);

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - headerOffset() - 16;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // Update URL hash without re-jumping
      history.replaceState(null, '', '#' + id);
    });
  });

})();
