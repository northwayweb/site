// ===============================
// Contact Form (client-side feedback only)
// ===============================
const form = document.getElementById('contact-form');
let status = document.getElementById('form-status');
const messageField = document.getElementById('message');
const messageCount = document.getElementById('message-count');
const MAX_MESSAGE_CHARS = 500;

const CONTACT_DRAFT_KEY = 'nw_contact_draft_v1';

let currentMathToken = '';

function showStatus(message, color) {
  const statusEl = getStatusEl();
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = color || '';
}

function saveContactDraft() {
  if (!form) return;
  try {
    const draft = {
      name: getFormValue(form, 'name'),
      business: getFormValue(form, 'business'),
      email: getFormValue(form, 'email'),
      message: getFormValue(form, 'message'),
    };
    sessionStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    // ignore
  }
}

function setupCurrentNavGlow() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const brand = nav.querySelector('.brand-logo');
  const linkEls = Array.from(nav.querySelectorAll('.site-nav-links a'));
  if (!brand && !linkEls.length) return;

  function clearCurrent() {
    if (brand) brand.classList.remove('is-current');
    linkEls.forEach((a) => a.classList.remove('is-current'));
  }

  function setCurrentLink(linkEl) {
    clearCurrent();
    if (linkEl) linkEl.classList.add('is-current');
  }

  function setCurrentBrand() {
    clearCurrent();
    if (brand) brand.classList.add('is-current');
  }

  function normalizePath(input) {
    try {
      const url = new URL(input, window.location.origin);
      return url.pathname || '/';
    } catch (e) {
      return String(input || '/');
    }
  }

  const currentPath = normalizePath(window.location.pathname || '/');
  const isHome = currentPath === '/' || currentPath.endsWith('/index.html');

  if (!isHome) {
    const match = linkEls.find((a) => {
      const href = a.getAttribute('href') || '';
      const path = normalizePath(href);
      return path === currentPath;
    });

    if (match) setCurrentLink(match);
    return;
  }

  const sectionLinks = linkEls
    .map((a) => {
      const href = String(a.getAttribute('href') || '');
      if (!href.startsWith('#')) return null;
      const id = href.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return null;
      return { link: a, el, id };
    })
    .filter(Boolean);

  let lastActiveLink = null;

  function setActiveLink(linkEl) {
    if (!linkEl) return;
    lastActiveLink = linkEl;
    setCurrentLink(linkEl);
  }

  function applyTopRule() {
    if (window.scrollY < 140) {
      setCurrentBrand();
      return true;
    }
    return false;
  }

  function applyFallbackRule() {
    if (applyTopRule()) return;
    if (lastActiveLink) {
      setCurrentLink(lastActiveLink);
      return;
    }
    clearCurrent();
  }

  if (!sectionLinks.length) {
    applyTopRule();
    window.addEventListener('scroll', applyTopRule, { passive: true });
    return;
  }

  const ratios = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry && entry.target ? entry.target.id : '';
        if (!id) return;
        ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      if (applyTopRule()) return;

      let best = null;
      let bestRatio = 0;

      sectionLinks.forEach((item) => {
        const r = ratios.get(item.id) || 0;
        if (r > bestRatio) {
          bestRatio = r;
          best = item;
        }
      });

      if (best && bestRatio > 0) {
        setActiveLink(best.link);
      } else {
        applyFallbackRule();
      }
    },
    {
      threshold: [0.18, 0.28, 0.38, 0.5, 0.62],
      rootMargin: '-20% 0px -55% 0px',
    }
  );

  sectionLinks.forEach((item) => observer.observe(item.el));

  applyTopRule();
  window.addEventListener('scroll', () => {
    if (window.scrollY < 140) setCurrentBrand();
  }, { passive: true });
}

function restoreContactDraft() {
  if (!form) return;
  try {
    const raw = sessionStorage.getItem(CONTACT_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);

    const nameEl = form.elements.namedItem('name');
    const businessEl = form.elements.namedItem('business');
    const emailEl = form.elements.namedItem('email');
    const messageEl = form.elements.namedItem('message');

    if (nameEl && typeof draft.name === 'string' && !String(nameEl.value || '').trim()) nameEl.value = draft.name;
    if (businessEl && typeof draft.business === 'string' && !String(businessEl.value || '').trim()) businessEl.value = draft.business;
    if (emailEl && typeof draft.email === 'string' && !String(emailEl.value || '').trim()) emailEl.value = draft.email;
    if (messageEl && typeof draft.message === 'string' && !String(messageEl.value || '').trim()) messageEl.value = draft.message;
  } catch (e) {
    // ignore
  }
}

function setMathToken(token) {
  currentMathToken = token || '';
  const tokenEl = document.getElementById('math-token');
  if (tokenEl) tokenEl.value = currentMathToken;
}

async function refreshMathChallenge() {
  const questionEl = document.getElementById('math-question');
  const answerEl = document.getElementById('math-answer');

  if (!questionEl || !answerEl) return;

  try {
    const res = await fetch('/.netlify/functions/math-challenge', { cache: 'no-store' });
    if (!res.ok) throw new Error('challenge_fetch_failed');
    const data = await res.json();
    if (!data || typeof data.question !== 'string' || typeof data.token !== 'string') {
      throw new Error('challenge_invalid');
    }

    questionEl.textContent = data.question;
    answerEl.value = '';
    setMathToken(data.token);
  } catch (e) {
    setMathToken('');
    questionEl.textContent = 'Loading…';
    showStatus('Unable to load the quick question. Please refresh and try again.', '#c00');
  }
}

function showContactErrorFromUrl() {
  const params = new URLSearchParams(window.location.search || '');
  const code = params.get('error');
  if (!code) return;

  restoreContactDraft();

  const messages = {
    challenge: 'Please answer the quick question to continue.',
    incorrect: 'That answer wasn’t correct. Please try the new question.',
    expired: 'That question expired. Please try the new question.',
    submit: 'Something went wrong while submitting. Please try again.',
  };

  showStatus(messages[code] || 'Please try again.', '#c00');

  try {
    const next = new URL(window.location.href);
    next.searchParams.delete('error');
    window.history.replaceState({}, '', next.pathname + next.search + next.hash);
  } catch (e) {
    // ignore
  }
}

function getFormValue(formEl, fieldName) {
  const field = formEl && formEl.elements ? formEl.elements.namedItem(fieldName) : null;
  if (!field) return '';
  return String(field.value || '').trim();
}

function updateMessageCount() {
  if (!messageField || !messageCount) return;
  const current = messageField.value.length;
  messageCount.textContent = `${current}/${MAX_MESSAGE_CHARS}`;
}

function getStatusEl() {
  if (status) return status;
  if (!form) return null;

  status = document.createElement('div');
  status.id = 'form-status';
  status.setAttribute('aria-live', 'polite');
  form.appendChild(status);
  return status;
}

if (messageField && messageCount) {
  updateMessageCount();
  messageField.addEventListener('input', updateMessageCount);
}

if (form) {
  form.addEventListener('submit', function (e) {
    const statusEl = getStatusEl();
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.style.color = '';
      statusEl.className = '';
    }

    const name = getFormValue(form, 'name');
    const business = getFormValue(form, 'business');
    const email = getFormValue(form, 'email');
    const message = getFormValue(form, 'message');

    if (!name || !business || !email || !message) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = 'Please fill in all fields.';
        statusEl.style.color = '#c00';
      }
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = 'Please enter a valid email address.';
        statusEl.style.color = '#c00';
      }
      return;
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = `Message must be ${MAX_MESSAGE_CHARS} characters or less.`;
        statusEl.style.color = '#c00';
      }
      return;
    }

    const mathAnswerEl = document.getElementById('math-answer');
    const mathAnswerRaw = mathAnswerEl ? String(mathAnswerEl.value || '').trim() : '';
    const mathAnswer = Number.parseInt(mathAnswerRaw, 10);

    const tokenEl = document.getElementById('math-token');
    const token = tokenEl ? String(tokenEl.value || '').trim() : '';

    if (!token) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = 'Please wait for the quick question to load.';
        statusEl.style.color = '#c00';
      }
      refreshMathChallenge();
      return;
    }

    if (Number.isNaN(mathAnswer)) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = 'Please answer the quick question.';
        statusEl.style.color = '#c00';
      }
      if (mathAnswerEl) mathAnswerEl.focus();
      return;
    }

    saveContactDraft();
  });
}

function setupHeroRotator() {
  const rotator = document.querySelector('.hero-rotator');
  if (!rotator) return;

  const raw = String(rotator.getAttribute('data-hero-images') || '');
  const urls = raw
    .split(',')
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  if (!urls.length) return;

  const imgA = rotator.querySelector('.hero-rotator-img.is-a');
  const imgB = rotator.querySelector('.hero-rotator-img.is-b');
  if (!imgA || !imgB) return;

  const panel = rotator.closest('.hero-panel');
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function preload(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ url, ok: true });
      img.onerror = () => resolve({ url, ok: false });
      img.src = url;
    });
  }

  Promise.all(urls.map(preload)).then((results) => {
    const available = results.filter((r) => r && r.ok).map((r) => r.url);
    if (!available.length) return;

    if (panel) panel.classList.add('has-hero-images');

    let index = 0;
    let active = imgA;
    let next = imgB;

    active.src = available[index];
    active.classList.add('is-active');
    next.classList.remove('is-active');

    if (prefersReducedMotion || available.length < 2) return;

    window.setInterval(() => {
      index = (index + 1) % available.length;
      const nextUrl = available[index];

      next.onload = () => {
        next.classList.add('is-active');
        active.classList.remove('is-active');
        const tmp = active;
        active = next;
        next = tmp;
      };

      next.src = nextUrl;
    }, 5200);
  });
}

function setupSiteNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const toggle = nav.querySelector('.site-nav-toggle');
  const menu = document.getElementById('site-nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupDemoNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!nav || !toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupThanksPage() {
  if (!document.body || !document.body.classList.contains('thanks-page')) return;

  function safeRedirect(url) {
    try {
      window.location.assign(url);
    } catch (e) {
      window.location.href = url;
    }
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const submitted = params.get('submitted') === '1';
    const note = document.getElementById('thanks-note');
    const title = document.querySelector('.thanks-page h1');
    const supporting = document.querySelector('.thanks-page .supporting');

    if (!submitted) {
      if (title) title.textContent = 'You’re in the right place';
      if (supporting) supporting.textContent = 'Please use the contact form to send a message.';
      if (note) {
        note.style.display = 'block';
        note.textContent = 'Redirecting you to the contact section…';
      }
      window.setTimeout(() => {
        safeRedirect('/#contact');
      }, 2200);
      return;
    }

    try {
      sessionStorage.removeItem('nw_contact_draft_v1');
    } catch (e) {
      // ignore
    }

    if (note) {
      note.style.display = 'block';
      note.textContent = 'Redirecting you back in a few seconds…';
    }
    window.setTimeout(() => {
      safeRedirect('/');
    }, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

showContactErrorFromUrl();
refreshMathChallenge();

// ===============================
// Scroll Reveal Animations
// ===============================
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

reveals.forEach((section) => {
  observer.observe(section);
});

const testimonialSlider = document.getElementById('testimonial-slider');
const testimonialTrack = document.getElementById('testimonial-track');

if (testimonialSlider && testimonialTrack) {
  const dots = testimonialSlider.querySelectorAll('.dot');
  const slides = testimonialTrack.querySelectorAll('.testimonial-slide');
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timerId = null;
  let paused = false;

  function setActiveDot(nextIndex) {
    dots.forEach((d, i) => {
      if (i === nextIndex) {
        d.setAttribute('aria-current', 'true');
      } else {
        d.removeAttribute('aria-current');
      }
    });
  }

  function goTo(nextIndex) {
    if (!slides.length) return;
    index = ((nextIndex % slides.length) + slides.length) % slides.length;
    testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
    setActiveDot(index);
  }

  function start() {
    if (prefersReducedMotion) return;
    if (timerId) return;
    timerId = window.setInterval(() => {
      if (paused) return;
      goTo(index + 1);
    }, 5200);
  }

  function stop() {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
    });
  });

  testimonialSlider.addEventListener('mouseenter', () => {
    paused = true;
  });

  testimonialSlider.addEventListener('mouseleave', () => {
    paused = false;
  });

  testimonialSlider.addEventListener('focusin', () => {
    paused = true;
  });

  testimonialSlider.addEventListener('focusout', () => {
    paused = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  goTo(0);
  start();
}

const faqAccordion = document.getElementById('faq-accordion');

if (faqAccordion) {
  const items = faqAccordion.querySelectorAll('details');

  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function centerRecaptchaMobile() {
  return;
}

document.addEventListener('DOMContentLoaded', () => {
  setupSiteNav();
  setupDemoNav();
  setupHeroRotator();
  setupThanksPage();
  setupCurrentNavGlow();
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
