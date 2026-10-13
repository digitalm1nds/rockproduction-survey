/* Event Attendee Survey — interactions */
(function () {
  'use strict';

  var form    = document.getElementById('survey');
  var root    = document.documentElement;
  var errorEl = form.querySelector('.error');
  var TOTAL_QUESTIONS = 2;

  var cfg = window.SURVEY_CONFIG || {};
  var endpoint = String(cfg.endpoint || '').trim();
  var onePerDevice = cfg.onePerDevice !== false;
  // With no Google Sheet link yet, the page still works but nothing is saved.
  var DEMO = !!window.SURVEY_DEMO || !endpoint;

  var storage = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Language ---------- */
  var TITLES = { ar: 'استبيان الحضور', en: 'Event Attendee Survey' };
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

  function setLang(lang, remember) {
    lang = lang === 'en' ? 'en' : 'ar';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.setAttribute('data-lang', lang);
    document.title = lang === 'ar' ? TITLES.ar + ' | ' + TITLES.en : TITLES.en + ' | ' + TITLES.ar;
    form.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
    if (remember) storage.set('survey_lang', lang);
  }

  /* ---------- Scenes & progress ---------- */
  function updateProgress(step) {
    form.setAttribute('data-step', step);
    var q = Math.min(Math.max(step, 1), TOTAL_QUESTIONS);
    var en = form.querySelector('[data-step-en]');
    var ar = form.querySelector('[data-step-ar]');
    en.textContent = 'Question ' + q + ' of ' + TOTAL_QUESTIONS;
    ar.textContent = 'السؤال ' + AR_DIGITS[q] + ' من ' + AR_DIGITS[TOTAL_QUESTIONS];
    form.querySelector('.progress-fill').style.setProperty('--p', (step >= 1 ? (q / TOTAL_QUESTIONS) * 100 : 0) + '%');
  }

  function show(id) {
    var next = document.getElementById(id);
    if (!next) return;
    form.querySelectorAll('.scene.is-active').forEach(function (s) { s.classList.remove('is-active'); });
    next.classList.add('is-active');
    updateProgress(parseInt(next.getAttribute('data-step'), 10) || 0);

    // keep the card in view on phones, where the banner sits above it
    var top = form.getBoundingClientRect().top + window.pageYOffset - 12;
    if (window.pageYOffset > top) window.scrollTo(0, top);

    var focusTarget = id === 'scene-thanks' ? next : next.querySelector('legend, h1, h2');
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  }

  form.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go && !go.disabled) show(go.getAttribute('data-go'));
    var lang = e.target.closest('[data-set-lang]');
    if (lang) setLang(lang.getAttribute('data-set-lang'), true);
    if (e.target.closest('[data-restart]')) restart();
  });

  /* ---------- Answers ---------- */
  function syncButtons() {
    form.querySelectorAll('[data-needs]').forEach(function (btn) {
      var name = btn.getAttribute('data-needs');
      btn.disabled = !form.querySelector('input[name="' + name + '"]:checked');
    });
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'improve') errorEl.hidden = true;
    syncButtons();
  });

  /* ---------- Send ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    if (btn.disabled || btn.classList.contains('is-sending')) return;
    errorEl.hidden = true;
    btn.classList.add('is-sending');
    btn.setAttribute('aria-busy', 'true');

    var request = DEMO
      ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 500); })
      : send();

    request.then(function (data) {
      if (!data || !data.ok) throw new Error((data && data.error) || 'failed');
      if (onePerDevice && !DEMO) storage.set('survey_done', '1');
      show('scene-thanks');
    }).catch(function () {
      errorEl.hidden = false;
    }).then(function () {
      btn.classList.remove('is-sending');
      btn.removeAttribute('aria-busy');
    });
  });

  // Sends the answers to the Google Apps Script web app.
  // A plain form-encoded POST needs no CORS preflight, which Apps Script can't answer.
  function send() {
    var data = new URLSearchParams(new FormData(form));
    data.append('lang', root.getAttribute('data-lang'));
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(endpoint, {
      method: 'POST',
      body: data,
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json();
    });
  }

  function restart() {
    form.reset();
    errorEl.hidden = true;
    syncButtons();
    show('scene-intro');
  }

  /* ---------- Start ---------- */
  // Open the page with #reset at the end of the link to answer again on this phone.
  function checkReset() {
    if (location.hash !== '#reset') return false;
    storage.del('survey_done');
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }
  checkReset();
  window.addEventListener('hashchange', function () { if (checkReset()) restart(); });

  if (!endpoint && !window.SURVEY_DEMO) {
    document.querySelector('.setup-note').hidden = false;
    console.warn('Survey: add your Google Apps Script link in assets/config.js — answers are not being saved.');
  }
  if (!onePerDevice) {
    form.querySelectorAll('[data-restart]').forEach(function (b) { b.hidden = false; });
    storage.del('survey_done');
  }

  setLang(root.getAttribute('data-lang'), false);
  syncButtons();
  updateProgress(0);
  if (onePerDevice && storage.get('survey_done')) show('scene-thanks');
})();
