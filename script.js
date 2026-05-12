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
  const pageMap = { 'home': 'index.html', 'about': 'about.html', 'quote': 'quote.html' };
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


// ===== LOADING SCREEN =====
(function() {
  const loader = document.getElementById('siteLoader');
  const bar = document.getElementById('loaderBar');
  if (!loader) return;

  let progress = 0;
  let videosLoaded = 0;
  const videos = document.querySelectorAll('video');
  const totalVideos = videos.length;
  let videoProgress = 0;

  // Track video loading
  videos.forEach(v => {
    if (v.readyState >= 3) {
      videosLoaded++;
    } else {
      const onReady = () => {
        videosLoaded++;
        videoProgress = totalVideos > 0 ? (videosLoaded / totalVideos) * 50 : 50;
        v.removeEventListener('canplaythrough', onReady);
        v.removeEventListener('loadeddata', onReady);
      };
      v.addEventListener('canplaythrough', onReady);
      v.addEventListener('loadeddata', onReady);
    }
  });

  // Smooth fake progress that catches up to real progress
  const startTime = Date.now();
  const minDuration = 1400; // minimum loader display time in ms
  const tickProgress = () => {
    const elapsed = Date.now() - startTime;
    const timeProgress = Math.min((elapsed / minDuration) * 50, 50);
    videoProgress = totalVideos > 0
      ? (videosLoaded / totalVideos) * 50
      : 50;
    const target = Math.min(timeProgress + videoProgress, 100);
    progress += (target - progress) * 0.15;
    bar.style.width = progress + '%';

    const documentReady = document.readyState === 'complete';
    const allVideosLoaded = videosLoaded >= totalVideos || totalVideos === 0;
    const minTimeMet = elapsed >= minDuration;

    if (progress >= 99 && documentReady && allVideosLoaded && minTimeMet) {
      bar.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.remove('loading');
        // Cleanup after fade
        setTimeout(() => loader.remove(), 900);
      }, 200);
      return;
    }
    requestAnimationFrame(tickProgress);
  };

  requestAnimationFrame(tickProgress);

  // Safety: hide loader after 8s no matter what
  setTimeout(() => {
    if (!loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
      setTimeout(() => loader.remove(), 900);
    }
  }, 8000);
})();