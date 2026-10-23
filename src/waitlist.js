/*!
 * Waitlist for Squarespace 7.1 — v1.0.0
 * Forma-style signup: text either side of a square, a CTA that opens a
 * full-section glass panel, a submit that collapses into a check circle with
 * "Send to a friend", and a close that condenses back to the square.
 *
 * Signups go through a native Newsletter Block in the same section, so emails
 * land wherever that block's Storage is set (Email Campaigns, Mailchimp, Sheets).
 *
 * Placement:
 *   hero   — first section on the page. The site header + menu hide while open.
 *   inline — any other section. The page scrolls the section into view and
 *            locks scroll while open; the header stays.
 *   auto   — hero if the section is first on the page, otherwise inline.
 *
 * Repo: github.com/zsawtelle-lgtm/sqsp-waitlist
 */
(function () {
  'use strict';

  var VERSION = '1.0.0';

  var DEFAULTS = {
    mode: 'squarespace',     // squarespace | demo (demo = fake success, no block needed)
    placement: 'auto',       // auto | hero | inline
    hideHeader: 'auto',      // auto | true | false   (auto = hide on hero only)
    scrollIntoView: true,    // inline: bring the section to the top of the screen on open
    lockScroll: true,        // stop page scroll while the panel is open
    closeOnEsc: true,
    intro: true,             // play the load sequence (false = resting state at once)
    introTrigger: 'view',    // view = when the section is on screen | load = page load
    rotateInterval: 3,       // seconds between rotating words (0 = no rotation)
    share: 'auto',           // auto (share sheet on phones, copy on desktop) | copy | native | off
    shareUrl: '',            // '' = this page
    toastText: 'Link copied to clipboard',
    errorInvalid: 'Please enter a valid email address',
    errorFailed: 'Something went wrong. Please try again.',
    successStatus: "You're on the list. We'll notify you at {email} when access opens.",
    submitTimeout: 12,       // seconds to wait for the newsletter block to answer
    resetOnClose: true       // clear the form and success state after closing
  };

  var EMAIL = /^\S+@\S+\.\S+$/;
  var setVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  var instances = [];

  /* ------------------------------------------------------------ Helpers */
  function parse(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v !== '' && v != null && !isNaN(v)) return Number(v);
    return v;
  }
  function camel(s) { return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); }
  function readOptions(root) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    var g = window.WaitlistConfig || {};
    for (k in g) if (k in DEFAULTS) o[k] = g[k];
    for (var i = 0; i < root.attributes.length; i++) {
      var a = root.attributes[i];
      if (a.name.indexOf('data-wl-') !== 0) continue;
      var key = camel(a.name.slice(8));
      if (key in DEFAULTS) o[key] = parse(a.value);
    }
    return o;
  }
  function inEditor() {
    return document.body.classList.contains('sqs-edit-mode-active') ||
      (window.self !== window.top && /\/config/.test(document.referrer || ''));
  }
  function header() { return document.querySelector('#header, header.header, body > header'); }
  function emit(root, name, detail) {
    root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
  }

  /* Submit through the hidden native Newsletter Block */
  function nativeSubmit(source, email, timeout) {
    return new Promise(function (resolve, reject) {
      var form = source && source.querySelector('form');
      var input = form && form.querySelector('input[type="email"], input[name="email"]');
      if (!form || !input) return reject(new Error('no-form'));

      // A second signup (after Back): put the block back in its form state first
      var prevBody = source.querySelector('.newsletter-form-body');
      var prevThanks = source.querySelector('.form-submission-text');
      if (prevBody) { prevBody.classList.remove('hidden'); prevBody.style.display = ''; }
      if (prevThanks) prevThanks.classList.add('hidden');

      setVal.call(input, email);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      var done = false;
      function finish(ok) { if (done) return; done = true; mo.disconnect(); clearTimeout(t); ok ? resolve() : reject(new Error('rejected')); }
      function check() {
        var thanks = source.querySelector('.form-submission-text, .newsletter-form-success, [class*="success"]');
        var body = source.querySelector('.newsletter-form-body');
        if ((thanks && !thanks.classList.contains('hidden') && thanks.textContent.trim()) ||
            (body && (body.classList.contains('hidden') || body.style.display === 'none'))) return finish(true);
        var err = source.querySelector('.field-error, .form-field-error, .form-submission-error');
        if (err && err.textContent.trim()) finish(false);
      }
      var mo = new MutationObserver(check);
      mo.observe(source, { subtree: true, childList: true, attributes: true, characterData: true });
      var t = setTimeout(function () { finish(false); }, timeout * 1000);

      var btn = form.querySelector('button[type="submit"], .newsletter-form-button, button');
      if (btn) btn.click(); else if (form.requestSubmit) form.requestSubmit();
    });
  }

  /* Page scroll lock (shared by every instance) */
  function lockScroll(on) {
    var html = document.documentElement;
    if (on) {
      html.style.setProperty('--wl-scrollbar', Math.max(0, window.innerWidth - html.clientWidth) + 'px');
      html.classList.add('wl-lock');
    } else {
      html.classList.remove('wl-lock');
      html.style.removeProperty('--wl-scrollbar');
    }
  }

  /* ------------------------------------------------------------ Instance */
  function init(root) {
    if (root.__wl) return; root.__wl = true;
    var o = readOptions(root);
    var section = root.closest('section.page-section');
    var source = null;
    var live = o.mode === 'squarespace' && section && !inEditor();

    var placement = o.placement;
    if (placement === 'auto') {
      var first = section && section.parentElement &&
        section.parentElement.querySelector(':scope > section.page-section');
      placement = section && first === section ? 'hero' : 'inline';
    }
    var hideHeader = o.hideHeader === 'auto' ? placement === 'hero' : !!o.hideHeader;
    if (o.mode === 'demo') hideHeader = false;

    if (live) {
      source = section.querySelector('.sqs-block-newsletter');
      if (source) source.classList.add('wl-source');
      section.classList.add('wl-host', 'wl-host--' + placement);
      section.appendChild(root); // lift out of the grid so it covers the full section
    }
    root.classList.add('wl--' + placement);
    if (!o.intro) root.classList.add('wl--static');

    var $ = function (s) { return root.querySelector(s); };
    var openBtn = $('[data-wl-open]'), form = $('[data-wl-form]'), input = $('.wl__input');
    var errEl = $('[data-wl-error]'), status = $('[data-wl-status]'), toast = $('[data-wl-toast]');
    var emailOut = $('[data-wl-email]'), closeBtn = $('[data-wl-close]'), shareBtn = $('[data-wl-share]');
    var busy = false, resetTimer, toastTimer, headerTimer, focusTimer;
    if (toast) toast.textContent = o.toastText;
    if (shareBtn && o.share === 'off') shareBtn.hidden = true;

    /* Prompt copy → staggered words */
    var words = $('[data-wl-words]');
    if (words && !words.querySelector('.wl__word')) {
      words.innerHTML = words.textContent.trim().split(/\s+/).map(function (w, i) {
        return '<span class="wl__word" style="--i:' + i + '">' + w.replace(/</g, '&lt;') + '</span>';
      }).join('');
    }

    /* Rotating word — sizer holds every word so the line never jumps */
    var rot = $('[data-wl-rotate]'), rotTimer, rotDelay, list = [];
    if (rot) {
      list = rot.getAttribute('data-wl-rotate').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      rot.innerHTML = list.map(function (w) { return '<span class="wl__rot-size">' + w + '</span>'; }).join('') +
        '<span class="wl__rot-val">' + (list[0] || '') + '</span>';
    }
    var idx = 0;
    function swap() {
      if (document.hidden || root.classList.contains('is-open')) return;
      idx = (idx + 1) % list.length;
      var cur = rot.querySelector('.wl__rot-val:last-child');
      var next = document.createElement('span');
      next.className = 'wl__rot-val'; next.textContent = list[idx];
      rot.appendChild(next);
      var ease = 'cubic-bezier(.16,1,.3,1)';
      if (cur.animate) {
        cur.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 700, easing: ease, fill: 'forwards' })
          .onfinish = function () { cur.remove(); };
        next.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: ease });
      } else cur.remove();
    }
    function startRot() {
      if (!rot || list.length < 2 || !o.rotateInterval || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      clearTimeout(rotDelay); clearInterval(rotTimer);
      rotDelay = setTimeout(function () { swap(); rotTimer = setInterval(swap, o.rotateInterval * 1000); }, o.intro ? 3200 : o.rotateInterval * 1000);
    }

    /* Start gate — play the intro once fonts are in (and the section is on screen) */
    function ready() { root.classList.add('is-ready'); startRot(); emit(root, 'wl:ready', { placement: placement, options: o }); }
    Promise.race([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      new Promise(function (r) { setTimeout(r, 1500); })
    ]).then(function () {
      var go = function () { requestAnimationFrame(function () { requestAnimationFrame(ready); }); };
      if (o.introTrigger === 'load' || !('IntersectionObserver' in window)) return go();
      var io = new IntersectionObserver(function (ents) {
        if (ents.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); }
      }, { threshold: .35 });
      io.observe(root);
    });

    /* Keep the X + back arrow clear of a header that stays over the section */
    function measureHeader() {
      var h = header(), overlap = 0;
      if (h && !hideHeader && !root.contains(h)) {
        var hb = h.getBoundingClientRect(), rb = root.getBoundingClientRect();
        var pos = getComputedStyle(h).position;
        if ((pos === 'absolute' || pos === 'fixed' || pos === 'sticky') && hb.height > 0 && hb.bottom > rb.top) {
          overlap = Math.min(hb.bottom - rb.top, rb.height / 3);
        }
      }
      root.style.setProperty('--wl-safe-top', (overlap < 4 ? 0 : Math.round(overlap)) + 'px');
    }
    window.addEventListener('resize', function () { if (root.classList.contains('is-open')) measureHeader(); });

    /* Inline: bring the section to the top of the screen, under a pinned header */
    function bringIntoView() {
      return new Promise(function (resolve) {
        if (placement !== 'inline' || !o.scrollIntoView || !section) return resolve();
        var h = header(), offset = 0;
        if (h && !hideHeader) {
          var pos = getComputedStyle(h).position;
          if (pos === 'fixed' || pos === 'sticky') offset = h.getBoundingClientRect().height;
        }
        var top = section.getBoundingClientRect().top + window.scrollY - offset;
        if (Math.abs(window.scrollY - top) < 4) return resolve();
        var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        var start = Date.now();
        (function wait() {
          if (Math.abs(window.scrollY - top) < 4 || Date.now() - start > 900) return resolve();
          requestAnimationFrame(wait);
        })();
      });
    }

    function setError(msg) {
      errEl.textContent = msg || '';
      errEl.classList.toggle('is-visible', !!msg);
      input.classList.toggle('is-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function resetForm() {
      root.classList.remove('is-submitted', 'is-busy', 'has-value');
      setVal.call(input, ''); setError(''); status.textContent = '';
      input.readOnly = false;
    }

    function open() {
      if (root.classList.contains('is-open')) return;
      clearTimeout(resetTimer);
      bringIntoView().then(function () {
        measureHeader();
        if (o.lockScroll) lockScroll(true);
        if (hideHeader) {
          clearTimeout(headerTimer);
          document.body.classList.remove('wl-header-return');
          document.body.classList.add('wl-hide-header');
        }
        root.classList.add('is-open');
        openBtn.setAttribute('aria-expanded', 'true');
        clearTimeout(focusTimer);
        focusTimer = setTimeout(function () { if (root.classList.contains('is-open')) input.focus({ preventScroll: true }); }, 950);
        emit(root, 'wl:open', { placement: placement });
      });
    }
    function close() {
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.focus({ preventScroll: true });
      if (hideHeader) {
        clearTimeout(headerTimer);
        headerTimer = setTimeout(function () { // header returns once the card has condensed
          document.body.classList.add('wl-header-return');
          document.body.classList.remove('wl-hide-header');
          headerTimer = setTimeout(function () { document.body.classList.remove('wl-header-return'); }, 600);
        }, 1000);
      }
      if (o.lockScroll) setTimeout(function () { if (!document.querySelector('.wl.is-open')) lockScroll(false); }, 1150);
      if (o.resetOnClose) resetTimer = setTimeout(resetForm, 1300);
      emit(root, 'wl:close', { placement: placement });
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    $('[data-wl-back]').addEventListener('click', function () { resetForm(); input.focus({ preventScroll: true }); });
    root.addEventListener('keydown', function (e) {
      if (o.closeOnEsc && e.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    input.addEventListener('input', function () {
      root.classList.toggle('has-value', input.value.length > 0);
      if (errEl.classList.contains('is-visible')) setError('');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || root.classList.contains('is-submitted')) return;
      var email = input.value.trim();
      if (!EMAIL.test(email)) { setError(o.errorInvalid); input.focus(); return; }

      busy = true; input.readOnly = true; root.classList.add('is-busy');
      var job = o.mode === 'demo' || !source
        ? new Promise(function (r) { setTimeout(r, 900); })
        : nativeSubmit(source, email, o.submitTimeout);

      job.then(function () {
        emailOut.textContent = email;
        status.textContent = o.successStatus.replace('{email}', email);
        root.classList.add('is-submitted');
        closeBtn.focus({ preventScroll: true });
        emit(root, 'wl:submitted', { placement: placement });
      }, function () {
        input.readOnly = false;
        setError(o.errorFailed);
        emit(root, 'wl:error', { placement: placement });
      }).then(function () { busy = false; root.classList.remove('is-busy'); });
    });

    if (shareBtn) shareBtn.addEventListener('click', function () {
      var url = o.shareUrl || (location.origin + location.pathname);
      var shown = function () {
        toast.classList.add('is-visible'); clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3000);
      };
      var copy = function () {
        try { navigator.clipboard.writeText(url).then(shown, function () {}); } catch (err) {}
      };
      var useNative = navigator.share && (o.share === 'native' ||
        (o.share === 'auto' && matchMedia('(pointer: coarse)').matches));
      if (useNative) navigator.share({ title: document.title, url: url }).catch(function (err) {
        if (err && err.name !== 'AbortError') copy();
      });
      else copy();
    });

    instances.push({ root: root, open: open, close: close, options: o, placement: placement, hideHeader: hideHeader, source: !!source });
  }

  /* ------------------------------------------------------------ Public API */
  function find(target) {
    if (target == null) return instances[0];
    if (typeof target === 'number') return instances[target];
    if (typeof target === 'string') target = document.querySelector(target);
    for (var i = 0; i < instances.length; i++) if (instances[i].root === target) return instances[i];
  }
  function boot() { document.querySelectorAll('[data-wl]').forEach(init); }

  window.Waitlist = {
    version: VERSION,
    defaults: DEFAULTS,
    init: boot,
    open: function (t) { var i = find(t); if (i) i.open(); },
    close: function (t) { var i = find(t); if (i) i.close(); },
    settings: function () {
      return instances.map(function (i) {
        return { id: i.root.id || null, placement: i.placement, hideHeader: i.hideHeader, newsletterBlock: i.source, options: i.options };
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('mercury:load', boot); // Squarespace AJAX page loads
})();
