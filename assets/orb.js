/* ========================== INTERFACE ORB ==========================
   Ported from the Interface OS app's own particle-sphere visualizer
   (src/ui/page.ts, the "brain" canvas) so the marketing site's hero orb
   is pixel-for-pixel the same simulation, just always resting in its
   idle/listening state. See that file for the full three-state version
   (listening / thinking / answering) this was trimmed from.
=================================================================== */
(function () {
  function mountOrb(canvas) {
    var N = 2400;                 // trimmed slightly from the app's 2700 for a single always-on hero instance
    var SIZE_SCALE = 1.45;

    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    var TRIG_N = 4096, TRIG_K = TRIG_N / (Math.PI * 2);
    var SIN = new Float32Array(TRIG_N);
    for (var _i = 0; _i < TRIG_N; _i++) SIN[_i] = Math.sin(_i / TRIG_K);
    function fsin(x) { return SIN[((x * TRIG_K) | 0) & (TRIG_N - 1)]; }
    function fcos(x) { return SIN[(((x * TRIG_K) | 0) + 1024) & (TRIG_N - 1)]; }

    function build() {
      var rnd = mulberry32(20260907);
      var o = {
        AX: new Float32Array(N), AY: new Float32Array(N), AZ: new Float32Array(N), AR: new Float32Array(N),
        P1: new Float32Array(N), P2: new Float32Array(N), KK: new Float32Array(N), SZ: new Float32Array(N),
        px: new Float32Array(N), py: new Float32Array(N), pz: new Float32Array(N),
        alpha: new Float32Array(N)
      };
      var i, y, r, th;
      for (i = 0; i < N; i++) {
        y = rnd() * 2 - 1;
        r = Math.sqrt(Math.max(0, 1 - y * y));
        th = rnd() * Math.PI * 2;
        o.AX[i] = Math.cos(th) * r;
        o.AY[i] = y;
        o.AZ[i] = Math.sin(th) * r;
        o.AR[i] = 0.88 + 0.12 * Math.pow(rnd(), 0.6);
        o.P1[i] = rnd() * Math.PI * 2;
        o.P2[i] = rnd() * Math.PI * 2;
        o.KK[i] = rnd();
        o.SZ[i] = 0.75 + rnd() * 0.55;
      }
      return o;
    }

    function curlX(x, y, z, t) { return fsin(y * 2.1 + t * 0.98) - fcos(z * 1.7 - t * 0.68); }
    function curlY(x, y, z, t) { return fsin(z * 2.3 - t * 0.85) - fcos(x * 1.9 + t * 1.18); }
    function curlZ(x, y, z, t) { return fsin(x * 2.0 + t * 0.75) - fcos(y * 2.2 - t * 0.91); }

    var o = build();
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, cx = 0, cy = 0, R = 0, dpr = 1;
    var t = 0, energy = 0.5, shownEnergy = 0;
    var ink = [27, 27, 27]; // matches --ink (#1b1b1b)

    var LEVELS = 14;
    var bIdx = []; for (var k = 0; k < LEVELS; k++) bIdx.push(new Int32Array(N));
    var bCnt = new Int32Array(LEVELS);
    var sx = new Float32Array(N), sy = new Float32Array(N), ss = new Float32Array(N);
    var styles = [];
    for (var lvl = 0; lvl < LEVELS; lvl++) {
      styles.push('rgba(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ',' + ((lvl + 1) / LEVELS).toFixed(3) + ')');
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width || canvas.width; h = rect.height || canvas.height;
      if (!w || !h) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      R = Math.min(w, h) * 0.41;
      return true;
    }

    function step(dt) {
      t += dt;
      shownEnergy += (energy - shownEnergy) * 0.06;
      var A = 0.42;
      for (var i = 0; i < N; i++) {
        var x = o.AX[i], y = o.AY[i], z = o.AZ[i];
        var qx = x + A * curlX(x, y, z, t);
        var qy = y + A * curlY(x, y, z, t);
        var qz = z + A * curlZ(x, y, z, t);
        var len = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
        var rr = o.AR[i] * (1 + 0.03 * fsin(t * 0.7 + o.P2[i]));
        o.px[i] = qx / len * rr; o.py[i] = qy / len * rr; o.pz[i] = qz / len * rr;
        o.alpha[i] = 0.93 + 0.07 * fsin(t * 3.70 + o.P1[i] * 0.6);
      }
    }

    function draw() {
      if (!w) { if (!resize()) return; }
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < LEVELS; k++) bCnt[k] = 0;
      var tilt = -0.10, ct = Math.cos(tilt), st_ = Math.sin(tilt);

      for (var i = 0; i < N; i++) {
        var a = o.alpha[i];
        var x = o.px[i], y = o.py[i], z = o.pz[i];
        var y2 = y * ct - z * st_, z2 = y * st_ + z * ct;
        var persp = 4.0 / Math.max(1.2, 4.0 - z2);
        var X = cx + x * R * persp;
        var Y = cy - y2 * R * persp;
        var depth = (z2 + 1) * 0.5;
        var dl = 0.50, ramp = dl + depth * (1 - dl);
        var stp = depth; // TDr/TQr/TPr collapse to a flat depth ramp in the resting state
        var av = a * (ramp * 0.55 + stp * 0.45);
        var size = SIZE_SCALE * (0.7 + o.KK[i] * 0.7) * 1.33 * (R / 205);
        av *= 0.85 + shownEnergy * 0.3;
        if (av <= 0.01) continue;
        if (av > 1) av = 1;
        var lvlIdx = (av * LEVELS) | 0; if (lvlIdx > LEVELS - 1) lvlIdx = LEVELS - 1;
        var n = bCnt[lvlIdx]++;
        bIdx[lvlIdx][n] = i;
        sx[i] = X; sy[i] = Y; ss[i] = size < 0.4 ? 0.4 : size;
      }

      for (var L = 0; L < LEVELS; L++) {
        var cnt = bCnt[L]; if (!cnt) continue;
        ctx.fillStyle = styles[L];
        var arr = bIdx[L];
        ctx.beginPath();
        for (var j = 0; j < cnt; j++) {
          var p = arr[j], s2 = ss[p];
          if (s2 > 2.8) {
            var r2 = s2 * 0.5;
            ctx.moveTo(sx[p] + r2, sy[p]);
            ctx.arc(sx[p], sy[p], r2, 0, Math.PI * 2);
          } else {
            ctx.rect(sx[p] - s2 * 0.5, sy[p] - s2 * 0.5, s2, s2);
          }
        }
        ctx.fill();
      }
    }

    var FRAME_INTERVAL = 1000 / 60, lastFrameAt = 0, raf;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - lastFrameAt < FRAME_INTERVAL) return;
      var dt = lastFrameAt ? (now - lastFrameAt) / 1000 : 1 / 60;
      lastFrameAt = now;
      step(Math.min(dt, 0.1));
      draw();
    }

    window.addEventListener('resize', function () { w = 0; });
    frame(performance.now());
  }

  function init() {
    document.querySelectorAll('canvas.orb-canvas').forEach(mountOrb);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
