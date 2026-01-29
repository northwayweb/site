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
  return;
});

document.getElementById('year').textContent = new Date().getFullYear();
