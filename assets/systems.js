// Interactive pieces for the systems-led pages: flow chains, tabs, the
// fragmented->connected visual, the Archive/Reach demos and the
// diagnostic form. No dependencies; everything degrades to static content.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function whenVisible(el, cb, threshold) {
    if (!hasIO || reduce) { cb(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(); } });
    }, { threshold: threshold || 0.35 });
    io.observe(el);
  }

  // ---- flow chains: stagger nodes in when visible ----
  var flowObs = hasIO && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-live'); } });
  }, { threshold: 0.25 }) : null;
  function armFlow(f) {
    var items = f.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) items[i].style.setProperty('--i', i);
    f.classList.remove('is-live');
    if (flowObs) { void f.offsetWidth; flowObs.unobserve(f); flowObs.observe(f); } else f.classList.add('is-live');
  }
  document.querySelectorAll('.flow').forEach(armFlow);

  // ---- tabs ----
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('.sx-tab');
    var scope = document.getElementById(group.getAttribute('data-tabs'));
    if (!scope) return;
    var panels = scope.querySelectorAll('.sx-panel');
    function select(tab) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.id === tab.getAttribute('aria-controls')); });
      scope.querySelectorAll('.sx-panel.is-active .flow').forEach(armFlow);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var i = Array.prototype.indexOf.call(tabs, t);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          n.focus(); select(n); e.preventDefault();
        }
      });
    });
  });

  // ---- fragmented -> connected ----
  function layoutLines(f) {
    var svg = f.querySelector('.frag-lines'); if (!svg) return;
    var w = f.clientWidth, h = f.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var chips = f.querySelectorAll('.frag-chip'), lines = svg.querySelectorAll('line');
    chips.forEach(function (c, i) {
      var l = lines[i]; if (!l) return;
      l.setAttribute('x1', w / 2); l.setAttribute('y1', h / 2);
      l.setAttribute('x2', parseFloat(c.getAttribute('data-x1')) / 100 * w);
      l.setAttribute('y2', parseFloat(c.getAttribute('data-y1')) / 100 * h);
    });
  }
  document.querySelectorAll('.frag').forEach(function (f) {
    layoutLines(f); window.addEventListener('resize', function () { layoutLines(f); });
    whenVisible(f, function () { setTimeout(function () { f.classList.add('is-connected'); }, reduce ? 0 : 900); }, 0.3);
  });

  // ---- Archive demo: type the question, then reveal results ----
  document.querySelectorAll('.ar').forEach(function (ar) {
    var q = ar.querySelector('.ar-q'), res = ar.querySelector('.ar-res'), cnt = ar.querySelector('.ar-count');
    if (!q || !res) return;
    var text = q.getAttribute('data-text') || q.textContent;
    function finish() { q.textContent = text; res.classList.add('is-live'); if (cnt) cnt.style.opacity = 1; }
    if (reduce || !hasIO) { finish(); return; }
    q.textContent = ''; if (cnt) cnt.style.opacity = 0;
    whenVisible(ar, function () {
      var i = 0;
      (function type() {
        q.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(type, 28);
        else setTimeout(function () { res.classList.add('is-live'); if (cnt) cnt.style.opacity = 1; }, 250);
      })();
    }, 0.4);
  });

  // ---- Reach demo: step through the pipeline ----
  document.querySelectorAll('.rc').forEach(function (rc) {
    var steps = rc.querySelectorAll('.rc-steps span'); if (!steps.length) return;
    var i = 0;
    function tick() { steps.forEach(function (s, n) { s.classList.toggle('on', n === i); }); i = (i + 1) % steps.length; }
    tick();
    if (reduce) return;
    whenVisible(rc, function () { setInterval(tick, 1500); }, 0.3);
  });

  // ---- diagnostic form ----
  var form = document.getElementById('diagForm');
  if (form) {
    var intents = {
      workflow: ['Show us your workflow.', 'Walk us through what you do by hand today. Rough is fine.'],
      archive: ['Tell us about your files.', 'Where does your business information live today, and what do people struggle to find?'],
      reach: ['Tell us who you want to reach.', 'Who are you trying to sell to, and how do you find them today?']
    };
    var intent = (new URLSearchParams(location.search)).get('intent');
    if (intents[intent]) {
      var h = document.getElementById('diagTitle'), l = document.getElementById('diagLede');
      if (h) h.textContent = intents[intent][0];
      if (l) l.textContent = intents[intent][1];
      var hid = form.querySelector('[name="came_from"]'); if (hid) hid.value = intent;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('diagSubmit'), ok = document.getElementById('diagSuccess');
      var rt = form.querySelector('[name="_replyto"]'), em = form.querySelector('[name="email"]');
      if (rt && em) rt.value = em.value;
      var label = btn.innerHTML; btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = 'Sending…';
      function restore() { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = label; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (r.ok) { form.style.display = 'none'; ok.classList.add('shown'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
          return r.json().catch(function () { return {}; }).then(function (d) {
            alert((d.errors && d.errors.map(function (x) { return x.message; }).join(', ')) || 'Something went wrong. Please email info@interfacecardiff.com');
            restore();
          });
        })
        .catch(function () { alert('Network error. Please email info@interfacecardiff.com'); restore(); });
    });
  }
})();
