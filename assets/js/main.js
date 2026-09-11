/* dyplomna.com — redesign v3 — interactions & animations
   GSAP + ScrollTrigger (scrub effects), Swiper (sliders). Everything degrades
   gracefully: if a library fails to load the content is still fully visible. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';

  /* ------------------------------------------ about: looping background video */
  $$('[data-about-video]').forEach((v) => {
    const sec = v.closest('.sec') || v;
    let inView = false;
    const play = () => { if (!inView || reduceMotion || document.hidden) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const pause = () => { if (!v.paused) v.pause(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; inView ? play() : pause(); }, { threshold: .05 }).observe(sec);
    } else { inView = true; play(); }
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  });

  /* ------------------------------------------ advantages: accordion + photo */
  $$('[data-acc]').forEach((list) => {
    const sec = list.closest('.sec');
    if (!sec) return;
    const btns = $$('[data-acc-btn]', list);
    const items = $$('[data-acc-item]', list);
    const imgs = $$('[data-adv-img]', sec); // <video> clips (a plain <img> still works: it is only toggled)
    const playMedia = (i) => {
      imgs.forEach((v, k) => {
        if (v.tagName !== 'VIDEO') return;
        if (k === i && !reduceMotion && !document.hidden) {
          try { if (v.readyState > 0) v.currentTime = 0; } catch (e) { /* not loaded yet */ }
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else if (!v.paused) v.pause();
      });
    };
    const pauseMedia = () => imgs.forEach((v) => { if (v.tagName === 'VIDEO' && !v.paused) v.pause(); });
    const badge = $('[data-adv-badge-text]', sec);
    const badgeIc = $('.adv__badge-ic', sec);
    const g = hasGsap && !reduceMotion ? window.gsap : null;
    let cur = 0;
    let touched = false;
    const setBody = (i, open) => {
      const body = $('.accord__body', items[i]);
      btns[i].setAttribute('aria-expanded', String(open));
      items[i].classList.toggle('is-open', open);
      if (!body) return;
      if (!g) { body.hidden = !open; return; }
      g.killTweensOf(body);
      if (open) {
        body.hidden = false;
        g.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'height,opacity' });
      } else {
        g.to(body, { height: 0, opacity: 0, duration: .35, ease: 'power2.in', onComplete: () => { body.hidden = true; g.set(body, { clearProps: 'height,opacity' }); } });
      }
    };
    const show = (i) => {
      if (i === cur || !items[i]) return;
      const prev = cur;
      cur = i;
      setBody(prev, false);
      setBody(i, true);
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
      if (inView) playMedia(i);
      if (badge) {
        const t = btns[i].querySelector('.accord__title');
        const ic = btns[i].querySelector('.accord__ic');
        badge.textContent = t ? t.textContent : '';
        if (badgeIc && ic) badgeIc.innerHTML = ic.innerHTML;
        if (g) g.fromTo(badge.parentElement, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
    };
    let timer = null;
    let inView = false;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!timer && inView && !touched && !document.hidden && !reduceMotion) timer = setInterval(() => show((cur + 1) % btns.length), 6000); };
    btns.forEach((b, i) => b.addEventListener('click', () => { touched = true; stop(); show(i); }));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; if (inView) { start(); playMedia(cur); } else { stop(); pauseMedia(); } }, { threshold: .3 }).observe(sec);
    } else { inView = true; playMedia(cur); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); pauseMedia(); } else { start(); if (inView) playMedia(cur); } });
    list.__acc = { show, start, stop, play: () => playMedia(cur) }; // debug hook
  });

  /* --------------------------------------------- "just ask": floating bubbles */
  $$('[data-ask]').forEach((sec) => {
    const bubbles = $$('.bubble', sec);
    if (!bubbles.length || !hasGsap || reduceMotion) return;
    const g = window.gsap;
    g.set(bubbles, { autoAlpha: 0, y: 26, scale: .9 });
    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      g.to(bubbles, { autoAlpha: 1, y: 0, scale: 1, duration: .7, stagger: .32, ease: 'back.out(1.6)', delay: .3 });
      bubbles.forEach((b, k) => g.to(b, { yPercent: k % 2 ? -14 : 14, duration: 2.6 + k * .35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 + k * .3 }));
    };
    sec.__ask = { play }; // debug hook
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { if (en[0].isIntersecting) play(); }, { threshold: .35 }).observe(sec);
    } else play();
  });

  /* --------------------------------------------------------- tilt tiles */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        el.style.setProperty('--gx', ((x + .5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((y + .5) * 100).toFixed(1) + '%');
        el.classList.add('is-tilt');
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-tilt'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);
  if (hasGsap && typeof window.ScrollToPlugin !== 'undefined') window.gsap.registerPlugin(window.ScrollToPlugin);
  const LOCALE = document.documentElement.lang || 'en';

  /* ------------------------------------------------------------ header */
  const hdr = $('#hdr');
  const onScroll = () => { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------- mobile menu */
  const burger = $('.burger');
  const mnav = $('#mobileMenu');
  const setMenu = (open) => {
    if (!mnav || !burger) return;
    if (open) mnav.hidden = false;
    requestAnimationFrame(() => {
      mnav.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      document.documentElement.classList.toggle('overflow-hidden', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    if (!open) setTimeout(() => { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 450);
  };
  burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  mnav?.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('[data-close-menu]')) setMenu(false);
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); });

  /* ------------------------------------------------- language dropdown */
  const dds = $$('details.lang__dd');
  dds.forEach((dd) => {
    dd.addEventListener('toggle', () => {
      if (dd.open) dds.forEach((o) => { if (o !== dd) o.open = false; });
    });
  });
  document.addEventListener('click', (e) => {
    dds.forEach((dd) => { if (dd.open && !dd.contains(e.target)) dd.open = false; });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    dds.forEach((dd) => {
      if (!dd.open) return;
      const inside = dd.contains(document.activeElement);
      dd.open = false;
      if (inside) { const s = dd.querySelector('summary'); if (s) s.focus(); } // keep keyboard focus on the toggle
    });
  });
  // close a dropdown when keyboard focus leaves it (otherwise it stays open over the content below)
  dds.forEach((dd) => dd.addEventListener('focusout', (e) => {
    if (dd.open && e.relatedTarget && !dd.contains(e.relatedTarget)) dd.open = false;
  }));

  /* ------------------------------------------------ footer: back to top */
  $$('[data-to-top]').forEach((b) => b.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const skip = $('.hdr a, .hdr button');
    if (skip) setTimeout(() => skip.focus({ preventScroll: true }), reduceMotion ? 0 : 600);
  }));

  /* --------------------------------------------------------------- modal */
  (() => {
    const lastActive = new WeakMap();
    const lockScroll = (on) => document.documentElement.classList.toggle('overflow-hidden', on);
    const openEl = (root) => {
      if (!(root instanceof HTMLElement)) return;
      lastActive.set(root, document.activeElement instanceof HTMLElement ? document.activeElement : null);
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      lockScroll(true);
      const dlg = root.querySelector('[role="dialog"]');
      requestAnimationFrame(() => {
        const first = root.querySelector('input:not([type="hidden"]):not([type="radio"]), textarea, button');
        (first || dlg)?.focus();
      });
    };
    const closeEl = (root) => {
      if (!(root instanceof HTMLElement)) return;
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      lastActive.get(root)?.focus?.();
    };
    $$('[data-modal]').forEach((root) => {
      root.addEventListener('click', (ev) => {
        const el = ev.target instanceof Element ? ev.target : null;
        if (!el) return;
        if (el.closest('[data-close]') || el.closest('[data-backdrop]')) closeEl(root);
      });
    });
    document.addEventListener('click', (e) => {
      const link = e.target instanceof Element ? e.target.closest('[data-modal-link]') : null;
      if (!link) return;
      const id = (link.getAttribute('href') || '').replace(/^#/, '');
      const root = document.getElementById(id);
      if (!root) return;
      e.preventDefault();
      setMenu(false);
      openEl(root);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      $$('[data-modal]').forEach((root) => { if (!root.hidden) closeEl(root); });
    });
    // open automatically when the page loads with #modal-leadform in the URL
    if (location.hash === '#modal-leadform') {
      const root = document.getElementById('modal-leadform');
      if (root) setTimeout(() => openEl(root), 300);
    }
  })();

  /* ---------------------------------------------------- UTM persistence */
  (() => {
    try {
      const params = new URLSearchParams(location.search);
      const utms = {};
      for (const [k, v] of params) if (k.startsWith('utm_') && v) utms[k] = v;
      if (!utms.utm_source && document.referrer) {
        try {
          const ref = new URL(document.referrer);
          if (ref.origin !== location.origin) utms.utm_source = ref.hostname.replace(/^www\./, '');
        } catch (_) { /* ignore */ }
      }
      const prev = JSON.parse(localStorage.getItem('utms') || '{}');
      localStorage.setItem('utms', JSON.stringify({ ...prev, ...utms }));
    } catch (_) { /* storage unavailable */ }
  })();

  /* ------------------------------------------------------------ lead form
     Same contract as the previous site: POST /api/lead with
     { data: { contact_method, messenger, phone_or_handle | email, message, user_info } } */
  (() => {
    if (window.__leadformBound) return;
    window.__leadformBound = true;

    const getUTMs = () => { try { return JSON.parse(localStorage.getItem('utms') || '{}'); } catch { return {}; } };
    const deviceInfo = () => ({ ua: navigator.userAgent, platform: navigator?.userAgentData?.platform || '' });
    const buildUserInfo = (locale) => {
      const utm = getUTMs();
      return {
        from_locale: locale,
        from_page: location.href,
        referrer: document.referrer || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language || '',
        device: deviceInfo(),
        utm_source: utm.utm_source || '',
        utm_medium: utm.utm_medium || '',
        utm_campaign: utm.utm_campaign || '',
        utm_term: utm.utm_term || '',
        utm_content: utm.utm_content || '',
      };
    };

    // tabs
    document.addEventListener('click', (e) => {
      const tab = e.target instanceof Element ? e.target.closest('.lf-tab') : null;
      if (!tab) return;
      const root = tab.closest('[data-lf]');
      if (!root) return;
      const formM = root.querySelector('.lf-form-m');
      const formE = root.querySelector('.lf-form-e');
      const tabM = root.querySelector('.lf-tab-m');
      const tabE = root.querySelector('.lf-tab-e');
      if (!formM || !formE || !tabM || !tabE) return;
      e.preventDefault();
      const isM = tab.classList.contains('lf-tab-m');
      formM.hidden = !isM;
      formE.hidden = isM;
      tabM.classList.toggle('is-active', isM);
      tabE.classList.toggle('is-active', !isM);
      tabM.setAttribute('aria-selected', String(isM));
      tabE.setAttribute('aria-selected', String(!isM));
    });

    // radio -> hidden "messenger"
    document.addEventListener('change', (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement) || el.type !== 'radio') return;
      const root = el.closest('[data-lf]');
      if (!root) return;
      const uid = root.getAttribute('data-uid') || 'lf';
      if (el.name !== `messenger-${uid}` || !el.checked) return;
      const hidden = root.querySelector('input[name="messenger"]');
      if (hidden) hidden.value = el.value;
    }, true);

    // submit
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || !form.classList.contains('lf-form')) return;
      const root = form.closest('[data-lf]');
      if (!root) return;
      e.preventDefault();
      const action = root.getAttribute('data-action') ?? '';
      const locale = root.getAttribute('data-locale') || LOCALE;
      const lfTitle = root.querySelector('.lf-title');
      const tabs = root.querySelector('.lf-tabs');
      const formM = root.querySelector('.lf-form-m');
      const formE = root.querySelector('.lf-form-e');
      const success = root.querySelector('.lf-success');
      const errorBox = root.querySelector('.lf-error');
      if (!action || !tabs || !formM || !formE || !success) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (errorBox) errorBox.hidden = true;
      const fields = Object.fromEntries(Array.from(new FormData(form)).filter(([k]) => !k.startsWith('messenger-')));
      const user_info = buildUserInfo(locale);
      try {
        const res = await fetch(`/api/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { ...fields, user_info } }),
        });
        if (!res.ok) throw new Error('Request failed');
        if (lfTitle) lfTitle.hidden = true;
        tabs.hidden = true;
        formM.hidden = true;
        formE.hidden = true;
        success.hidden = false;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: action.toUpperCase() });
      } catch (err) {
        console.error(err);
        if (btn) btn.disabled = false;
        if (errorBox) errorBox.hidden = false;
      }
    }, true);
  })();

  /* ------------------------------------------------------- copy to clipboard */
  document.addEventListener('click', async (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-copy],[data-copy-target]') : null;
    if (!el) return;
    const sel = el.getAttribute('data-copy-target');
    const v = el.getAttribute('data-copy') ||
      (sel && ((t) => (t ? (t.value ?? t.textContent ?? '').trim() : ''))(document.querySelector(sel)));
    if (!v) return;
    if (el.hasAttribute('data-copy-only')) e.preventDefault();
    try {
      await navigator.clipboard.writeText(v);
      const prev = el.textContent;
      el.textContent = el.getAttribute('data-copy-ok') || 'Copied';
      setTimeout(() => { el.textContent = prev; }, 900);
    } catch {
      window.prompt('Copy to clipboard (Ctrl/Cmd+C):', v);
    }
  });

  /* ------------------------------------------------------------ accordion */
  $$('.qa__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!open));
      panel?.classList.toggle('is-open', !open);
    });
  });

  /* ------------------------------------------------------ smooth anchors */
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!a || a.hasAttribute('data-modal-link')) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 90;
    if (hasGsap && window.ScrollToPlugin && !reduceMotion) window.gsap.to(window, { duration: .9, scrollTo: y, ease: 'power3.inOut' });
    else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* -------------------------------------------------------------- reveals */
  const revealEls = $$('.reveal, .reveal-right');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
    // safety net: never leave content hidden
    setTimeout(() => revealEls.forEach((el) => el.classList.add('is-in')), 6000);
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }
  // stagger indexes
  $$('[data-stagger]').forEach((wrap) => {
    Array.from(wrap.children).forEach((c, i) => c.style.setProperty('--i', String(i)));
  });

  /* -------------------------------------------------------- progress rings */
  const rings = $$('[data-ring]');
  const setRing = (el) => {
    const pct = Math.max(0, Math.min(100, Number(el.getAttribute('data-ring')) || 0));
    const len = 125.66;
    el.style.strokeDashoffset = String(len * (1 - pct / 100));
  };
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { setRing(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.3 });
    rings.forEach((r) => io2.observe(r));
  } else rings.forEach(setRing);

  /* -------------------------------------------------------------- counters */
  const fmt = (n) => { try { return Math.round(n).toLocaleString(LOCALE); } catch { return String(Math.round(n)); } };
  const counters = $$('[data-counter]');
  const runCounter = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = Number(el.getAttribute('data-counter')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const raw = el.hasAttribute('data-raw');
    const render = (v) => { el.textContent = prefix + (raw ? String(Math.round(v)) : fmt(v)) + suffix; };
    if (reduceMotion || !hasGsap) { render(target); return; }
    const obj = { v: 0 };
    window.gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => render(obj.v) });
  };
  if ('IntersectionObserver' in window) {
    const io3 = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); io3.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach((c) => io3.observe(c));
  } else counters.forEach(runCounter);

  /* ------------------------------------------------------------- steps */
  $$('[data-steps]').forEach((wrap) => {
    const steps = $$('[data-step]', wrap);
    const num = $('[data-step-num]', wrap);
    const bar = $('[data-step-bar]', wrap);
    const docLines = $$('[data-step-line]', wrap);
    if (!steps.length) return;
    const activate = (i) => {
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      if (num) num.textContent = String(i + 1);
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
      docLines.forEach((l, j) => l.classList.toggle('is-on', j <= i));
    };
    activate(0);
    const update = () => {
      const line = window.innerHeight * 0.5;
      let idx = 0;
      steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= line) idx = j; });
      activate(idx);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    steps.forEach((s, i) => s.addEventListener('mouseenter', () => activate(i)));
  });

  /* ------------------------------------------ services: tabbed feature cards */
  $$('[data-ftabs]').forEach((bar) => {
    const tabs = $$('.ftabs__tab', bar);
    const wrap = bar.closest('.sec') || document;
    const cards = $$('[data-fcard]', wrap);
    const box = bar.closest('[data-fbox]');
    if (box && cards[0]) box.style.setProperty('--fc-active', getComputedStyle(cards[0]).getPropertyValue('--fc-bg').trim());
    let cur = 0;
    let busy = false;
    /* overlay cards on the photo: pop in one after another, bars fill, numbers count up, then a gentle float */
    const playScene = (card) => {
      const sc = card && $('[data-scene]', card);
      if (!sc || !hasGsap || reduceMotion) return;
      const g = window.gsap;
      const items = $$('.sc', sc);
      const bars = $$('[data-bar]', sc);
      const counts = $$('[data-count]', sc);
      // the cut-out person (.fcard__fg) stays static: it is part of the photo, only the cards animate
      if (card.__sceneTl) card.__sceneTl.kill();
      g.killTweensOf(items.concat(bars));
      g.set(items, { opacity: 0, y: 22, scale: .9 });
      g.set(bars, { scaleX: 0 });
      counts.forEach((el) => { el.textContent = '0'; });
      const tl = g.timeline({ delay: .25 });
      tl.to(items, { opacity: 1, y: 0, scale: 1, duration: .7, stagger: .18, ease: 'back.out(1.4)' }, 0);
      bars.forEach((b) => tl.to(b, { scaleX: 1, duration: 1.3, ease: 'power3.inOut' }, .5));
      counts.forEach((el) => {
        const o = { v: 0 };
        const to = +el.dataset.count || 0;
        tl.to(o, { v: to, duration: 1.3, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } }, .5);
      });
      tl.add(() => { g.to(items, { y: (k) => (k % 2 ? 4 : -4), duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: .4 } }); }, '>-.1');
      card.__sceneTl = tl;
    };
    const stopScene = (card) => {
      if (!card || !hasGsap) return;
      if (card.__sceneTl) { card.__sceneTl.kill(); card.__sceneTl = null; }
      window.gsap.killTweensOf($$('.sc', card));
    };
    const show = (i) => {
      if (i === cur || !cards[i] || busy) return;
      const prev = cards[cur];
      const next = cards[i];
      cur = i;
      tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); });
      if (box) box.style.setProperty('--fc-active', getComputedStyle(next).getPropertyValue('--fc-bg').trim());
      const swap = () => { prev.hidden = true; prev.classList.remove('is-on'); next.hidden = false; next.classList.add('is-on'); };
      if (hasGsap && !reduceMotion) {
        busy = true;
        setTimeout(() => { busy = false; }, 1200); // safety net if a tween is interrupted
        const g = window.gsap;
        g.to(prev, { opacity: 0, y: 14, duration: .22, ease: 'power1.in', onComplete: () => {
          swap();
          stopScene(prev);
          playScene(next);
          g.set(prev, { clearProps: 'opacity,transform' });
          g.fromTo(next, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out', clearProps: 'opacity,transform', onComplete: () => { busy = false; } });
          g.fromTo($$('.fcard__copy > *', next), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .06, ease: 'power3.out', clearProps: 'opacity,transform', delay: .08 });
          g.fromTo($('.fcard__media', next), { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out', clearProps: 'opacity,transform', delay: .05 });
        } });
      } else swap();
    };
    /* autoplay: next service every 5 s; pauses on hover / focus, when the tab is hidden or the block is off-screen */
    const AUTO = 7000;
    let timer = null;
    let inView = true;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!timer && inView && !document.hidden && !reduceMotion) timer = setInterval(() => show((cur + 1) % cards.length), AUTO); };
    const restart = () => { stop(); start(); };
    const sec = bar.closest('.sec') || bar;
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let played = false;
    const firstPlay = () => { if (!played) { played = true; playScene(cards[cur]); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; if (inView) { start(); firstPlay(); } else stop(); }, { threshold: .05 }).observe(sec);
    } else { start(); firstPlay(); }
    bar.__auto = { start, stop, setInView: (v) => { inView = v; }, play: () => playScene(cards[cur]) }; // debug hook (visual tests)
    tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); restart(); }));
    bar.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus();
      show(n);
      restart();
    });
  });

  /* ------------------------------------------ "how we work": folder + dots + flying cards */
  (() => {
    const sec = $('[data-process]');
    if (!sec) return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    /* title: scale to the full width of the section */
    const title = $('[data-fit-title]', sec);
    const fitTitle = () => {
      if (!title) return;
      title.style.fontSize = '';
      const base = parseFloat(getComputedStyle(title).fontSize);
      const avail = sec.clientWidth * 0.94;
      const w = title.scrollWidth;
      if (w > 0) title.style.fontSize = Math.max(18, Math.min(170, base * avail / w)) + 'px';
    };
    fitTitle();
    window.addEventListener('resize', fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

    /* interactive dot grid with cursor glow + ripples */
    const canvas = $('[data-dots]', sec);
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      const GAP = 26, RAD = 190;
      let mx = -1e4, my = -1e4, run = false, raf = 0, w = 0, h = 0;
      const ripples = [];
      let lastRip = 0, lrx = 0, lry = 0;
      const size = () => {
        const r = sec.getBoundingClientRect();
        const d = Math.min(window.devicePixelRatio || 1, 2);
        w = r.width; h = r.height;
        canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        ctx.setTransform(d, 0, 0, d, 0, 0);
        draw();
      };
      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const now = performance.now();
        for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t > 1500) ripples.splice(i, 1);
        const base = () => 'rgba(48,57,84,.16)';
        for (let y = GAP * .5; y < h; y += GAP) {
          for (let x = GAP * .5; x < w; x += GAP) {
            const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
            let r = 1.3, a = 0, hot = 0;
            if (d2 < RAD * RAD) {
              let t = 1 - Math.sqrt(d2) / RAD; t = t * t * (3 - 2 * t);
              r += 3.2 * t; hot = t; a = .16 + .5 * t;
            }
            for (let k = 0; k < ripples.length; k++) {
              const rp = ripples[k];
              const age = (now - rp.t) / 1500;             // 0..1
              const ring = age * 340;                      // ring radius in px
              const dist = Math.sqrt((x - rp.x) ** 2 + (y - rp.y) ** 2);
              const band = Math.abs(dist - ring);
              if (band < 46) {
                const wgt = (1 - band / 46) * (1 - age);
                r += 2.6 * wgt; hot = Math.max(hot, wgt); a = Math.max(a, .16 + .45 * wgt);
              }
            }
            ctx.fillStyle = hot > 0 ? 'rgba(64,157,246,' + a.toFixed(3) + ')' : base();
            ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
          }
        }
      };
      const tick = () => { draw(); raf = (run && (ripples.length || mx > -1e3)) ? requestAnimationFrame(tick) : 0; };
      const kick = () => { if (run && !raf) raf = requestAnimationFrame(tick); };
      if (finePointer && !reduceMotion) {
        sec.addEventListener('pointermove', (e) => {
          const r = canvas.getBoundingClientRect();
          mx = e.clientX - r.left; my = e.clientY - r.top;
          const now = performance.now();
          if (now - lastRip > 90 && Math.hypot(mx - lrx, my - lry) > 28 && ripples.length < 10) {
            ripples.push({ x: mx, y: my, t: now }); lastRip = now; lrx = mx; lry = my;
          }
          kick();
        }, { passive: true });
        sec.addEventListener('pointerleave', () => { mx = my = -1e4; kick(); });
      }
      window.addEventListener('resize', size);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { run = en[0].isIntersecting; if (run) kick(); }).observe(sec);
      } else run = true;
      size();
    }

    /* doodles & badges: float and get pushed away by the cursor */
    const folder = $('[data-folder]', sec);
    const fls = $$('[data-fl]', sec);
    if (folder && fls.length && finePointer && !reduceMotion) {
      let mx = -1e4, my = -1e4, run = false, raf = 0;
      const t0 = Date.now();
      const st = fls.map((el, i) => ({ el, x: 0, y: 0, ph: i * 1.7, sp: .0009 + ((i * 37) % 10) * .00012 }));
      window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
      const R = 150, PUSH = 30;
      const tick = () => {
        const t = Date.now() - t0;
        for (const o of st) {
          const r = o.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - o.x, cy = r.top + r.height / 2 - o.y;
          const dx = cx - mx, dy = cy - my, d = Math.sqrt(dx * dx + dy * dy);
          let tx = 0, ty = 0;
          if (d < R && d > .001) { let f = 1 - d / R; f = f * f * (3 - 2 * f); tx = dx / d * PUSH * f; ty = dy / d * PUSH * f; }
          ty += Math.sin(t * o.sp + o.ph) * 3.2; tx += Math.cos(t * o.sp * .8 + o.ph) * 1.6;
          o.x += (tx - o.x) * .1; o.y += (ty - o.y) * .1;
          o.el.style.transform = 'translate3d(' + o.x.toFixed(2) + 'px,' + o.y.toFixed(2) + 'px,0)';
        }
        raf = run ? requestAnimationFrame(tick) : 0;
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { run = en[0].isIntersecting; if (run && !raf) raf = requestAnimationFrame(tick); }).observe(sec);
      } else { run = true; raf = requestAnimationFrame(tick); }
    }

    /* cards fly out of the folder automatically: when the block reaches the top of the
       viewport the page stops scrolling, the folder opens and the five steps fly out one by
       one; afterwards scrolling is released. Plays once per page view. */
    const row = $('[data-fly]', sec);
    const cards = $$('[data-fly-card]', sec);
    const fimg = $('[data-folder-img]', sec);
    if (!row || !cards.length || !fimg || !hasST || reduceMotion) return;
    const g = window.gsap;
    const n = cards.length;
    const mobile = window.innerWidth <= 940 || !window.matchMedia('(pointer: fine)').matches;
    let cardTl = [];
    let openTl = null;
    let played = false;
    let playing = false;

    const measure = (card) => {
      const fo = fimg.getBoundingClientRect(), co = card.getBoundingClientRect();
      return { dx: (fo.left + fo.width * .5) - (co.left + co.width * .5), dy: (fo.top + fo.height * .16) - (co.top + co.height * .5) };
    };
    const build = () => {
      if (playing) return;
      cardTl.forEach((t) => t.kill());
      if (openTl) openTl.kill();
      g.set(cards, { clearProps: 'transform,opacity' });
      g.set(fimg, { clearProps: 'transform' });
      const pos = cards.map(measure);
      openTl = g.timeline({ paused: true })
        .to(fls, { opacity: 1, duration: .6, stagger: .06, ease: 'power1.out' }, 0)
        .to(fimg, { scale: .86, transformOrigin: '50% 62%', duration: .8, ease: 'power2.inOut' }, .1);
      cardTl = cards.map((card, i) => {
        const p = pos[i];
        return g.timeline({ paused: true })
          .fromTo(card, { x: p.dx, y: p.dy, scale: .45, opacity: 0, rotation: i % 2 ? 7 : -7 },
            { y: p.dy - 190, opacity: 1, scale: .82, duration: .55, ease: 'power2.out' })
          .to(card, { x: 0, y: 0, scale: 1, rotation: 0, duration: .9, ease: 'power2.inOut' });
      });
      g.set(fls, { opacity: played ? 1 : 0 });
      if (played) { openTl.progress(1); cardTl.forEach((t) => t.progress(1)); }
    };
    const GAP = .75;
    const sequence = (onDone) => {
      playing = true;
      openTl.play();
      cards.forEach((c, i) => g.delayedCall(.6 + i * GAP, () => cardTl[i].play()));
      g.delayedCall(.6 + (n - 1) * GAP + 1.55, () => { playing = false; played = true; onDone && onDone(); });
    };

    // page opened already below the block (deep link): show the final state
    if (window.scrollY > sec.getBoundingClientRect().top + window.scrollY - 40) played = true;
    build();
    if (mobile) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { if (en[0].isIntersecting && !played && !playing) sequence(); }, { threshold: .45 }).observe(folder || sec);
      }
    } else {
      window.ScrollTrigger.create({
        trigger: sec, start: 'top 25%', end: 'bottom top',
        onEnter: () => { if (played || playing) return; sequence(); },
        onRefresh: build,
      });
    }
    window.addEventListener('resize', () => { if (!playing) build(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try { window.ScrollTrigger.refresh(); } catch (e) { /* noop */ } });
  })();

  /* ------------------------------------------- huge section titles: fit to width */
  (() => {
    const titles = $$('.sec__title--big[data-fit-title]');
    if (!titles.length) return;
    const fit = () => titles.forEach((t) => {
      t.style.fontSize = '';
      const base = parseFloat(getComputedStyle(t).fontSize);
      const avail = (t.parentElement ? t.parentElement.clientWidth : window.innerWidth) * 0.98;
      const w = t.scrollWidth;
      if (w > 0 && avail > 0) t.style.fontSize = Math.max(16, Math.min(160, base * avail / w)) + 'px'; // low floor: long words (lt) must never overflow a phone screen
    });
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();

  /* ---------------------------------------------- hero: cursor halo over the grid */
  $$('[data-halo]').forEach((sec) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    sec.addEventListener('pointermove', (e) => {
      const r = sec.getBoundingClientRect();
      sec.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      sec.style.setProperty('--my', (e.clientY - r.top) + 'px');
      sec.classList.add('is-hover');
    });
    sec.addEventListener('pointerleave', () => sec.classList.remove('is-hover'));
  });

  /* ------------------------------------------ home hero: rotating word + order dashboard */
  (() => {
    const wrap = $('[data-dash]');
    const dataEl = wrap && wrap.querySelector('[data-hero-data]');
    if (!wrap || !dataEl) return;
    let D;
    try { D = JSON.parse(dataEl.textContent); } catch { return; }
    const word = $('[data-rot-word]');
    const rot = word && word.parentElement;
    const N = (D.rot || []).length;
    const START = D.start || 0;

    /* keep "Ваша {word}" on one line: shrink the tagline so the longest word still fits */
    const tag = $('.hero__tagline');
    const l1 = tag && tag.querySelector('.tag__l1');
    const fitTag = () => {
      if (!tag || !l1 || !word || !rot) return;
      tag.style.fontSize = '';
      const base = parseFloat(getComputedStyle(tag).fontSize);
      const avail = tag.clientWidth;
      const cur = word.textContent;
      const savedW = rot.style.width;
      rot.style.width = 'auto';
      let max = 0;
      (D.rot || []).forEach((w) => { word.textContent = w; max = Math.max(max, l1.scrollWidth); });
      word.textContent = cur;
      rot.style.width = savedW;
      if (max > avail && avail > 0) tag.style.fontSize = Math.floor(base * avail / max * 100) / 100 + 'px';
    };
    fitTag();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTag);
    let tagRaf = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(tagRaf); tagRaf = requestAnimationFrame(fitTag); });
    if (!hasGsap || reduceMotion || N < 2) return;

    const g = window.gsap;
    const PERIOD = 6400;
    let cur = START;      // index of the work type shown now
    let master = null;
    let timer = null;
    let visible = !document.hidden;
    let inView = true;

    const swapWord = (next) => {
      if (!word || !rot) return;
      const w0 = rot.offsetWidth;
      g.to(word, { yPercent: -110, opacity: 0, duration: .32, ease: 'power2.in', onComplete: () => {
        word.textContent = next;
        g.set(rot, { width: 'auto' });
        const w1 = rot.offsetWidth;
        g.set(rot, { width: w0 });
        g.to(rot, { width: w1, duration: .5, ease: 'power3.out', onComplete: () => g.set(rot, { width: 'auto' }) });
        g.fromTo(word, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .55, ease: 'power3.out' });
      } });
    };

    const el = {
      name: $('[data-dash-name]', wrap), step: $('[data-dash-step]', wrap), bar: $('[data-dash-bar]', wrap),
      arc: $('[data-dash-arc]', wrap), pct: $('[data-dash-pct]', wrap), stage: $('[data-dash-stage]', wrap),
      uniq: $('[data-dash-uniq]', wrap), file: $('[data-dash-file]', wrap), msg: $('[data-dash-msg]', wrap), ava: $('[data-dash-ava]', wrap),
      pill: $('.dash__pill', wrap), fileCard: $('.dash__file', wrap), msgCard: $('.dash__msg', wrap),
    };
    const state = { pct: 0, uniq: 0 };
    const hello = $('.dash__card--hello', wrap);
    const playScene = (idx) => {
      cur = idx;
      if (master) master.kill();
      const tl = g.timeline();
      master = tl;
      const n = D.n;
      swapWord(D.rot[idx] || D.rot[0]);
      const ti = n.step[idx] || 1;
      const renderPct = () => {
        if (el.pct) el.pct.textContent = String(Math.round(state.pct));
        if (el.arc) el.arc.setAttribute('stroke-dashoffset', String(100 - state.pct));
        if (el.bar) el.bar.style.width = state.pct + '%';
      };
      /* the order card flies out to the left and a new one flies in from the right */
      if (hello) {
        tl.to(hello, { x: -90, rotation: -5, autoAlpha: 0, duration: .45, ease: 'power2.in' }, .05);
        tl.add(() => {
          if (el.name) el.name.textContent = D.names[idx] || '';
          if (el.step) el.step.textContent = D.step + ' ' + ti + ' · ' + (D.titles[ti - 1] || '');
          if (el.stage) el.stage.textContent = D.stage[idx] || '';
          state.pct = 0; renderPct();
        }, .5);
        tl.fromTo(hello, { x: 110, rotation: 5, autoAlpha: 0 }, { x: 0, rotation: 0, autoAlpha: 1, duration: .75, ease: 'back.out(1.3)', immediateRender: false }, .55);
      }
      tl.to(state, { pct: n.prog[idx], duration: 1.6, ease: 'power2.out', onUpdate: renderPct }, 1.05);
      tl.to(state, { uniq: n.uniq[idx], duration: 1.2, ease: 'power2.out', onUpdate: () => { if (el.uniq) el.uniq.textContent = String(Math.round(state.uniq)); } }, .5);
      tl.fromTo(el.pill, { scale: 1 }, { scale: 1.05, duration: .25, yoyo: true, repeat: 1, ease: 'power2.inOut', immediateRender: false }, 1.5);
      if (el.file) {
        tl.to(el.fileCard, { x: 18, autoAlpha: 0, duration: .3, ease: 'power2.in' }, .6);
        tl.add(() => { el.file.textContent = (D.names[idx] || '').replace(/\s+/g, '_') + '_v4.docx'; }, .9);
        tl.fromTo(el.fileCard, { x: -18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .55, ease: 'power3.out', immediateRender: false }, .95);
      }
      if (el.msgCard) {
        tl.to(el.msgCard, { y: 16, autoAlpha: 0, duration: .3, ease: 'power2.in' }, 1.1);
        tl.add(() => { if (el.msg) el.msg.textContent = '«' + (D.msgs[idx] || '') + '»'; if (el.ava && D.photos && D.photos.length) el.ava.src = D.photos[idx % D.photos.length]; }, 1.4);
        tl.fromTo(el.msgCard, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .65, ease: 'back.out(1.4)', immediateRender: false }, 1.45);
      }
    };
    wrap.__playScene = playScene; // debug hook

    const tick = () => {
      timer = null;
      if (!visible || !inView) return;
      playScene((cur + 1) % N);
      timer = setTimeout(tick, PERIOD);
    };
    const start = () => { if (!timer && visible && inView) timer = setTimeout(tick, PERIOD); };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; visible ? start() : stop(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; inView ? start() : stop(); }, { threshold: .15 }).observe(wrap);
    } else start();

    /* intro: copy slides up, the dashboard flies in, cards pop one by one, then the first scene's numbers count up */
    const cards = $$('[data-dash-card]', wrap);
    const win = $('.dash__win', wrap);
    const backs = $$('.dash__back', wrap);
    const intro = g.timeline({ delay: .1 });
    intro.from('.hero__tagline .tag__part, .hero__tagline .rot', { y: 30, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out' }, 0)
      .from('.hero__h1, .hero--home .hero__lead, .hcalc, .hero__proof, .hero__stats, .hero--home .chips', { y: 22, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out' }, .2)
      .from(backs, { x: 60, opacity: 0, rotate: 0, duration: 1, stagger: .1, ease: 'power3.out' }, .15)
      .from(win, { x: 90, opacity: 0, rotationY: -14, transformPerspective: 1400, duration: 1.1, ease: 'power3.out', clearProps: 'rotationY,transformPerspective' }, .25)
      .from(cards, { y: 26, opacity: 0, scale: .96, duration: .7, stagger: .14, ease: 'back.out(1.5)' }, .7)
      .add(() => { const first = g.timeline(); master = first; state.pct = 0; state.uniq = 0;
        first.to(state, { pct: D.n.prog[cur], duration: 1.6, ease: 'power2.out', onUpdate: () => { if (el.pct) el.pct.textContent = String(Math.round(state.pct)); if (el.arc) el.arc.setAttribute('stroke-dashoffset', String(100 - state.pct)); if (el.bar) el.bar.style.width = state.pct + '%'; } }, 0);
        first.to(state, { uniq: D.n.uniq[cur], duration: 1.2, ease: 'power2.out', onUpdate: () => { if (el.uniq) el.uniq.textContent = String(Math.round(state.uniq)); } }, .2);
      }, 1.1);
    /* idle life: cards and panels breathe, sparkles drift */
    cards.forEach((c, k) => { if (c !== hello) g.to(c, { y: k % 2 ? -5 : 5, duration: 2.8 + k * .4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 + k * .3 }); });
    backs.forEach((b, k) => g.to(b, { y: k ? 8 : -8, rotate: k ? '+=1' : '-=1', duration: 5 + k, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 }));
    $$('.spark', wrap).forEach((s, k) => g.to(s, { y: k % 2 ? -9 : 9, rotate: k % 2 ? 25 : -25, scale: 1.15, duration: 2.2 + k * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  })();

  /* ------------------------------------------ orders around the world: dotted globe */
  (() => {
    const root = $('[data-globe]');
    const canvas = root && root.querySelector('canvas');
    const raw = window.__GLOBE;
    if (!root || !canvas || !Array.isArray(raw) || raw.length < 4) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const D = Math.PI / 180;
    const n = raw.length >> 1;
    const px = new Float32Array(n); const py = new Float32Array(n); const pz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const la = raw[2 * i] * D; const lo = raw[2 * i + 1] * D; const cl = Math.cos(la);
      px[i] = cl * Math.sin(lo); py[i] = Math.sin(la); pz[i] = cl * Math.cos(lo);
    }
    const HOME = { lat: 44, lon: 32 };
    const view = { lat: HOME.lat, lon: HOME.lon };
    const pins = $$('[data-pin]', root);
    const cards = $$('[data-card]', root);
    const wrap = root.closest('[data-globe-wrap]') || root;
    const sec = root.closest('.sec') || document;
    const AUTO = reduceMotion ? 0 : .045;
    let W = 0; let R = 0; let dpr = 1;
    const size = () => {
      W = root.clientWidth || 1; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
      R = Math.max(1, W / 2 - 4); // never negative (a hidden/zero-width block would break the radial gradient)
    };
    const rot = () => ({ cL: Math.cos(view.lon * D), sL: Math.sin(view.lon * D), cT: Math.cos(view.lat * D), sT: Math.sin(view.lat * D) });
    const proj = (lat, lon, r) => {
      const la = lat * D; const lo = lon * D; const cl = Math.cos(la);
      const x = cl * Math.sin(lo); const y = Math.sin(la); const z = cl * Math.cos(lo);
      const x1 = x * r.cL - z * r.sL; const z1 = x * r.sL + z * r.cL;
      const y2 = y * r.cT - z1 * r.sT; const z2 = y * r.sT + z1 * r.cT;
      return { x: W / 2 + R * x1, y: W / 2 - R * y2, z: z2 };
    };
    const co = () => parseFloat(getComputedStyle(root).getPropertyValue('--co')) || 1;
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      const c = W / 2;
      const grd = ctx.createRadialGradient(c - R * .38, c - R * .42, R * .08, c, c, R);
      grd.addColorStop(0, '#FFFFFF'); grd.addColorStop(.55, '#EAF1FA'); grd.addColorStop(1, '#C9DAEE');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(48,57,84,.10)'; ctx.stroke();
      const r = rot();
      const r0 = Math.max(1.3, R / 108);
      ctx.fillStyle = '#303954';
      for (let i = 0; i < n; i++) {
        const x1 = px[i] * r.cL - pz[i] * r.sL; const z1 = px[i] * r.sL + pz[i] * r.cL;
        const y2 = py[i] * r.cT - z1 * r.sT; const z2 = py[i] * r.sT + z1 * r.cT;
        if (z2 <= .03) continue;
        ctx.globalAlpha = .16 + .74 * z2;
        ctx.beginPath(); ctx.arc(c + R * x1, c - R * y2, r0 * (.5 + .5 * z2), 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const k = co();
      pins.forEach((p, i) => {
        const q = proj(parseFloat(p.dataset.lat), parseFloat(p.dataset.lon), r);
        const vis = Math.max(0, Math.min(1, (q.z - .08) * 5));
        p.style.left = q.x + 'px'; p.style.top = q.y + 'px'; p.style.opacity = String(vis);
        const card = cards[i];
        if (!card) return;
        card.style.left = q.x + (parseFloat(card.dataset.dx) || 0) * k + 'px';
        card.style.top = q.y + (parseFloat(card.dataset.dy) || 0) * k + 'px';
        card.style.opacity = String(vis);
        card.style.pointerEvents = vis > .5 ? 'auto' : 'none';
      });
    };

    /* drag to rotate (inertia), auto-rotation when idle, click a card to bring it to the front */
    let dragging = false; let lx = 0; let ly = 0; let vel = 0; let moved = 0; let downCard = null;
    let idleAt = 0; let intro = false; let running = false; let raf = 0;
    const goTo = (lat, lon) => {
      idleAt = performance.now() + 6000; vel = 0;
      const dl = ((lon - view.lon + 540) % 360) - 180;
      const tLat = Math.max(-40, Math.min(60, lat - 6));
      if (hasGsap && !reduceMotion) {
        const t = { lat: view.lat, lon: view.lon };
        window.gsap.to(t, { lat: tLat, lon: view.lon + dl, duration: 1.1, ease: 'power3.inOut', onUpdate: () => { view.lat = t.lat; view.lon = t.lon; } });
      } else { view.lat = tLat; view.lon += dl; }
    };
    root.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vel = 0;
      downCard = e.target instanceof Element ? e.target.closest('[data-card]') : null;
      root.classList.add('is-drag');
      try { root.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    root.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx; const dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      view.lon -= dx * .35; view.lat = Math.max(-60, Math.min(78, view.lat + dy * .3)); vel = -dx * .35;
      idleAt = performance.now() + 4000;
    });
    const up = () => {
      if (!dragging) return;
      dragging = false; root.classList.remove('is-drag');
      if (downCard && moved < 6) goTo(parseFloat(downCard.dataset.lat), parseFloat(downCard.dataset.lon));
      downCard = null; idleAt = performance.now() + 4000;
    };
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
    cards.forEach((card) => card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(parseFloat(card.dataset.lat), parseFloat(card.dataset.lon)); } }));
    const loop = (t) => {
      if (!dragging && !intro) {
        if (Math.abs(vel) > .02) { view.lon += vel; vel *= .93; } else if (t > idleAt) view.lon += AUTO;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    size(); draw();
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 80); });

    /* appearance: counter, globe rises and spins into place, pins drop in, cards fade in */
    const animate = hasGsap && !reduceMotion;
    const pinIns = $$('.gpin__in', root); const cardIns = $$('.gcard__in', root);
    const numEl0 = $('[data-globe-num]', sec);
    if (animate) { window.gsap.set(wrap, { autoAlpha: 0 }); window.gsap.set(pinIns, { scale: 0, transformOrigin: '50% 100%' }); window.gsap.set(cardIns, { autoAlpha: 0 }); if (numEl0) numEl0.textContent = '0'; }
    let appeared = false;
    const appear = () => {
      if (appeared) return;
      appeared = true;
      const numEl = $('[data-globe-num]', sec);
      const lang = document.documentElement.lang || 'en';
      const fmt = (v) => { try { return Math.round(v).toLocaleString(lang); } catch { return String(Math.round(v)); } };
      if (!animate) return;
      const g = window.gsap;
      intro = true;
      const tl = g.timeline({ onComplete: () => { intro = false; idleAt = performance.now() + 1500; } });
      const o = { v: 0 };
      if (numEl) tl.to(o, { v: parseFloat(numEl.dataset.globeNum) || 0, duration: 7.5, ease: 'power1.out', onUpdate: () => { numEl.textContent = fmt(o.v); } }, 0);
      tl.fromTo(wrap, { y: 160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, ease: 'power3.out' }, .1);
      const r = { lon: HOME.lon - 90 }; view.lon = r.lon;
      tl.to(r, { lon: HOME.lon, duration: 2.1, ease: 'power3.out', onUpdate: () => { view.lon = r.lon; } }, .1);
      tl.fromTo(pinIns, { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2.4)', stagger: .22 }, 1.3);
      tl.fromTo(cardIns, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .22, ease: 'power3.out' }, 1.45);
    };
    root.__globe = { view, appear, draw }; // debug hook
    let visible = !document.hidden; let inView = false;
    const sync = () => { if (visible && inView) { start(); appear(); } else stop(); };
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; sync(); }, { threshold: .25 }).observe(root);
    } else { inView = true; sync(); }
  })();

  /* ---------------------------------------------------------- price calculator */
  $$('[data-calc]').forEach((root) => {
    let D;
    try { D = JSON.parse($('[data-calc-data]', root).textContent); } catch { return; }
    const P = D.P; const S = D.s;
    const typeBtns = $$('[data-calc-type]', root);
    const selC = $('[data-calc-country]', root); const selL = $('[data-calc-lang]', root);
    const rngP = $('[data-calc-pages]', root); const rngD = $('[data-calc-days]', root);
    const pagesVal = $('[data-calc-pages-val]', root); const daysVal = $('[data-calc-days-val]', root);
    const pagesScale = $('[data-calc-pages-scale]', root); const daysScale = $('[data-calc-days-scale]', root);
    const phdNote = $('[data-calc-phd]', root);
    const addons = $$('[data-calc-addon]', root);
    const totalEl = $('[data-calc-total]', root); const eurEl = $('[data-calc-eur]', root); const rowsEl = $('[data-calc-rows]', root);
    if (!selC || !selL || !rngP || !rngD || !totalEl) return;
    let type = D.defType;
    const SYM = { PLN: 'zł', UAH: '₴', KZT: '₸', CZK: 'Kč', EUR: '€', GBP: '£' };
    const STEP = { PLN: 10, UAH: 50, KZT: 500, CZK: 50, EUR: 5, GBP: 5 };
    const ceil = (v, s) => Math.ceil(v / s - 1e-9) * s;
    const fmt = (n) => { try { return n.toLocaleString(D.lang); } catch { return String(n); } };
    const plural = (n, forms) => {
      if (!forms || !forms.length) return '';
      if (forms.length < 3) return forms[(D.lang === 'fr' ? n <= 1 : n === 1) ? 0 : 1];
      const a = n % 10; const b = n % 100;
      if (D.lang === 'cs' || D.lang === 'sk') return n === 1 ? forms[0] : (n >= 2 && n <= 4) ? forms[1] : forms[2];
      if (D.lang === 'pl') return n === 1 ? forms[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? forms[1] : forms[2];
      if (D.lang === 'lt') return (a === 1 && b !== 11) ? forms[0] : (a >= 2 && a <= 9 && (b < 11 || b > 19)) ? forms[1] : forms[2];
      return (a === 1 && b !== 11) ? forms[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? forms[1] : forms[2];
    };
    const market = () => P.markets[selC.value] || P.markets.PL;
    const coef = () => Math.max(market().k, (P.markets[P.langs[selL.value]] || market()).k);
    const money = (zl) => { const m = market(); return fmt(ceil(zl * m.rate, STEP[m.cur] || 1)) + ' ' + (SYM[m.cur] || m.cur); };
    const eur = (zl) => '≈ €' + fmt(ceil(zl * P.eur, 5));
    const fill = (r) => { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); };
    const term = (t, n) => n + ' ' + plural(n, t.months ? S.months : S.days);
    const urgency = (days) => { for (const [min, pct] of P.urgency) if (days >= min) return pct; return P.urgency[P.urgency.length - 1][1]; };
    const core = (t, pages) => {
      if (t.model === 'chapters') {
        const n = Math.min(6, Math.max(2, Math.round((pages - 10) / t.cp)));
        return { zl: P.base.intro + n * P.base.chapter + P.base.concl + (t.norm ? P.base.norm : 0), n };
      }
      if (t.model === 'per') { const n = Math.max(1, Math.round(pages / 20)); return { zl: n * P.base.chapter, n }; }
      if (t.model === 'flat') { const extra = t.extra_from ? Math.max(0, pages - t.extra_from) * t.extra_rate : 0; return { zl: t.base + extra, extra }; }
      return { zl: t.base };
    };
    const row = (l, v, total) => '<div class="calc__row' + (total ? ' calc__row--total' : '') + '"><span>' + l + '</span><b>' + v + '</b></div>';
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fromList = () => {
      const k = coef();
      $$('[data-calc-from]', root.closest('.sec') || document).forEach((el) => {
        const key = el.dataset.calcFrom; const t = P.types[key];
        const zl = t ? core(t, t.pages[2]).zl : P.base[key];
        el.textContent = S.from + ' ' + money(ceil(zl * k, 10));
      });
    };
    const calc = () => {
      const t = P.types[type]; const k = coef(); const pages = +rngP.value; const n = +rngD.value;
      const c = core(t, pages);
      const coreK = ceil(c.zl * k, 10);
      const u = t.months ? 0 : urgency(n);
      const withU = ceil(coreK * (1 + u), 10);
      let add = 0; const addRows = [];
      addons.forEach((a) => {
        const key = a.dataset.calcAddon; const lab = a.closest('label'); const priceEl = lab && lab.querySelector('[data-calc-addon-price]');
        const included = key === 'norm' && !!t.norm; const allowed = key !== 'it' || t.model === 'chapters';
        if (lab) lab.hidden = !allowed;
        a.disabled = included;
        if (included) a.checked = false;
        const pz = ceil((P.base[key] || 0) * k, 10);
        const label = (key === 'it' ? S.from + ' ' : '') + money(pz);
        if (priceEl) priceEl.textContent = included ? S.norm_incl : label;
        if (a.checked && !a.disabled && allowed) { add += pz; addRows.push([S.addon_names[key] || key, label]); }
      });
      const total = withU + add;
      if (pagesVal) pagesVal.textContent = pages + ' ' + S.pp;
      const urgTxt = u ? S.urgent.replace('{n}', String(Math.round(u * 100))) : S.no_surcharge;
      if (daysVal) daysVal.innerHTML = esc(term(t, n)) + (u ? ' <i>· ' + esc(urgTxt) + '</i>' : '');
      totalEl.textContent = S.from + ' ' + money(total);
      if (eurEl) eurEl.textContent = market().cur === 'EUR' ? '' : eur(total);
      let rows = row(esc(S.types[type] || type), esc(S.from + ' ' + money(coreK)));
      rows += row(esc(S.pages + ': ' + pages + ' ' + S.pp), esc(c.n ? c.n + ' ' + plural(c.n, S.chapters) : c.extra ? '+ ' + money(ceil(c.extra * k, 10)) : S.in_price));
      rows += row(esc(S.deadline + ': ' + term(t, n)), esc(t.months ? S.no_surcharge : urgTxt));
      rows += row(esc(S.country + ' · ' + S.language), esc((S.markets[selC.value] || selC.value) + ' · ' + (S.langs[selL.value] || selL.value)));
      addRows.forEach((r) => { rows += row(esc(r[0]), esc('+ ' + r[1])); });
      rows += row(esc(S.total), esc(S.from + ' ' + money(total)), true);
      if (rowsEl) rowsEl.innerHTML = rows;
      fromList();
    };
    const applyType = () => {
      const t = P.types[type];
      typeBtns.forEach((b) => { const on = b.dataset.calcType === type; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      rngP.min = t.pages[0]; rngP.max = t.pages[1]; rngP.value = t.pages[2];
      const d = t.months || t.days; rngD.min = d[0]; rngD.max = d[1]; rngD.value = d[2];
      if (pagesScale) pagesScale.innerHTML = '<span>' + t.pages[0] + '</span><span>' + t.pages[1] + '</span>';
      if (daysScale) daysScale.innerHTML = '<span>' + esc(term(t, d[0])) + '</span><span>' + esc(term(t, d[1])) + '</span>';
      if (phdNote) phdNote.hidden = t.model !== 'from';
      fill(rngP); fill(rngD); calc();
    };
    typeBtns.forEach((b) => b.addEventListener('click', () => { type = b.dataset.calcType; applyType(); }));
    [selC, selL].forEach((s) => s.addEventListener('change', calc));
    [rngP, rngD].forEach((r) => r.addEventListener('input', () => { fill(r); calc(); }));
    addons.forEach((a) => a.addEventListener('change', calc));
    root.__calc = { calc, applyType, setType: (t) => { type = t; applyType(); } }; // debug hook
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('type') && P.types[q.get('type')]) type = q.get('type');
      const topic = (q.get('topic') || '').trim();
      if (topic) $$('textarea[name="message"]').forEach((ta) => { if (!ta.value) ta.value = topic; });
    } catch { /* ignore */ }
    applyType();
  });

  /* -------------------------------------------------------- hero intro */
  if (hasGsap && !reduceMotion) {
    const g = window.gsap;
    const title = $('.hero__title');
    if (title && !title.dataset.split) {
      title.dataset.split = '1';
      const words = title.textContent.trim().split(/\s+/);
      title.innerHTML = words.map((w) => `<span class="w">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');
      g.from(title.querySelectorAll('.w'), { yPercent: 60, opacity: 0, rotateX: -30, duration: .9, stagger: .045, ease: 'power3.out', delay: .1 });
    }
    g.from('.hero .stars .ic', { scale: 0, opacity: 0, duration: .5, stagger: .06, ease: 'back.out(2)', delay: .05 });
    g.from('.hero .chip', { y: 18, opacity: 0, scale: .9, duration: .6, stagger: .05, ease: 'back.out(1.6)', delay: .55 });
    // floating decorations: gentle infinite drift
    $$('.float, .doc__float').forEach((el, i) => {
      g.to(el, { y: i % 2 ? -10 : 10, x: i % 3 ? 4 : -4, duration: 2.6 + (i % 3) * .5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .2 });
    });
    $$('.doc__paper').forEach((el, i) => {
      g.to(el, { y: i % 2 ? -6 : 6, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  }

  /* -------------------------------------------------- scrub effects (GSAP) */
  if (hasST && !reduceMotion) {
    const g = window.gsap;
    // hero card parallax on scroll-out
    const heroCard = $('.hero__card');
    if (heroCard) {
      g.to('.hero__copy', { yPercent: -8, opacity: .6, ease: 'none', scrollTrigger: { trigger: heroCard, start: 'bottom 80%', end: 'bottom 20%', scrub: true } });
    }
    // banner glow drift on scroll
    $$('.banner').forEach((b) => {
      g.fromTo($('.banner__glow', b), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
      g.fromTo($('.orb', b), { rotate: -8, scale: .9 }, { rotate: 8, scale: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // big statement titles slide in
    $$('.intro').forEach((el) => {
      g.from($('.intro__mark', el), { scale: .4, opacity: 0, duration: .8, ease: 'back.out(1.7)', scrollTrigger: { trigger: el, start: 'top 75%' } });
    });
  }

  /* ---------------------------------------------------------------- swipers */
  if (typeof window.Swiper !== 'undefined') {
    $$('.experts-swiper').forEach((el) => {
      const slides = el.querySelectorAll('.swiper-slide').length;
      new window.Swiper(el, {
        slidesPerView: 'auto', centeredSlides: true, spaceBetween: 20, grabCursor: true,
        loop: slides >= 4, speed: 650,
        navigation: { nextEl: el.parentElement.querySelector('[data-next]'), prevEl: el.parentElement.querySelector('[data-prev]') },
        keyboard: { enabled: true },
        a11y: { enabled: true },
      });
    });
    $$('.reviews-swiper').forEach((el) => {
      const slides = el.querySelectorAll('.swiper-slide').length;
      new window.Swiper(el, {
        slidesPerView: 'auto', centeredSlides: true, spaceBetween: 18, grabCursor: true,
        loop: slides >= 4, speed: 700,
        autoplay: reduceMotion || slides < 2 ? false : { delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true },
        navigation: { nextEl: el.parentElement.querySelector('[data-next]'), prevEl: el.parentElement.querySelector('[data-prev]') },
        keyboard: { enabled: true },
        a11y: { enabled: true },
      });
    });
  }

  /* -------------------------------------------------------- html.js flag */
  document.documentElement.classList.add('js-ready');
})();
