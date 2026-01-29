// ===============================
// Contact Form (client-side feedback only)
// ===============================
const form = document.getElementById('contact-form');
let status = document.getElementById('form-status');
const messageField = document.getElementById('message');
const messageCount = document.getElementById('message-count');
const MAX_MESSAGE_CHARS = 500;

let currentMathAnswer = null;

function generateMathChallenge() {
  const questionEl = document.getElementById('math-question');
  const answerEl = document.getElementById('math-answer');

  if (!questionEl || !answerEl) return;

  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  currentMathAnswer = a + b;
  questionEl.textContent = `${a} + ${b} =`;
  answerEl.value = '';
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
    e.preventDefault();

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
      if (statusEl) {
        statusEl.textContent = 'Please fill in all fields.';
        statusEl.style.color = '#c00';
      }
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (statusEl) {
        statusEl.textContent = 'Please enter a valid email address.';
        statusEl.style.color = '#c00';
      }
      return;
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      if (statusEl) {
        statusEl.textContent = `Message must be ${MAX_MESSAGE_CHARS} characters or less.`;
        statusEl.style.color = '#c00';
      }
      return;
    }

    const mathAnswerEl = document.getElementById('math-answer');
    const mathAnswerRaw = getFormValue(form, 'math_answer');
    const mathAnswer = Number.parseInt(mathAnswerRaw, 10);

    if (Number.isNaN(mathAnswer) || currentMathAnswer === null || mathAnswer !== currentMathAnswer) {
      if (statusEl) {
        statusEl.textContent = 'Please answer the quick question correctly.';
        statusEl.style.color = '#c00';
      }
      generateMathChallenge();
      if (mathAnswerEl) mathAnswerEl.focus();
      return;
    }

    const isNetlifyForm = form.hasAttribute('data-netlify');

    if (isNetlifyForm) {
      if (statusEl) {
        statusEl.textContent = 'Submitting…';
        statusEl.style.color = '#18405a';
        statusEl.className = 'form-status form-status--submitting';
      }

      const formData = new FormData(form);
      const body = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        body.append(key, String(value));
      }

      const action = form.getAttribute('action') || '/';

      fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Submission failed');

          if (statusEl) {
            statusEl.className = 'form-status form-status--success';
            statusEl.innerHTML =
              '<div class="form-success" role="status">' +
              '<div class="form-success__title">Thank you! <span class="form-flower" aria-hidden="true">🌸</span></div>' +
              '<div class="form-success__text">Your message has been received. We will get back to you shortly.</div>' +
              '</div>';
          }

          form.reset();
          updateMessageCount();
          generateMathChallenge();
        })
        .catch(() => {
          if (statusEl) {
            statusEl.className = 'form-status form-status--error';
            statusEl.textContent =
              'Something went wrong while submitting. Please try again or email support@northwayweb.ca.';
            statusEl.style.color = '#c00';
          }
        });

      return;
    }

    if (statusEl) {
      statusEl.textContent =
        'Thank you! Your message has been received. We will get back to you shortly.';
      statusEl.style.color = '#18405a';
    }

    form.reset();
    updateMessageCount();
  });
}

generateMathChallenge();

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
