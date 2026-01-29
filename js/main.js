// ===============================
// Contact Form (client-side feedback only)
// ===============================
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const messageField = document.getElementById('message');
const messageCount = document.getElementById('message-count');
const MAX_MESSAGE_CHARS = 500;

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

if (messageField && messageCount) {
  updateMessageCount();
  messageField.addEventListener('input', updateMessageCount);
}

if (form) {
  form.addEventListener('submit', function (e) {
    status.textContent = '';
    status.style.color = '';

    const name = getFormValue(form, 'name');
    const business = getFormValue(form, 'business');
    const email = getFormValue(form, 'email');
    const message = getFormValue(form, 'message');

    if (!name || !business || !email || !message) {
      e.preventDefault();
      status.textContent = 'Please fill in all fields.';
      status.style.color = '#c00';
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      e.preventDefault();
      status.textContent = 'Please enter a valid email address.';
      status.style.color = '#c00';
      return;
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      e.preventDefault();
      status.textContent = `Message must be ${MAX_MESSAGE_CHARS} characters or less.`;
      status.style.color = '#c00';
      return;
    }

    const isNetlifyForm = form.hasAttribute('data-netlify');

    if (isNetlifyForm) {
      status.textContent = 'Submitting…';
      status.style.color = '#18405a';
      return;
    }

    e.preventDefault();
    status.textContent =
      'Thank you! Your message has been received. We will get back to you shortly.';
    status.style.color = '#18405a';

    form.reset();
    updateMessageCount();
  });
}

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
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
  const formEl = document.getElementById('contact-form');
  if (!formEl) return;

  const container = formEl.querySelector('.netlify-recaptcha');
  if (!container) return;

  if (!isMobile) {
    container.style.transform = '';
    return;
  }

  const iframe = container.querySelector('iframe');
  if (!iframe) return;

  const formRect = formEl.getBoundingClientRect();
  const iframeRect = iframe.getBoundingClientRect();
  if (!formRect.width || !iframeRect.width) return;

  const targetCenterX = formRect.left + formRect.width / 2;
  const currentCenterX = iframeRect.left + iframeRect.width / 2;
  const delta = targetCenterX - currentCenterX;

  container.style.transform = `translateX(${Math.round(delta)}px)`;
}

document.addEventListener('DOMContentLoaded', () => {
  centerRecaptchaMobile();

  const formEl = document.getElementById('contact-form');
  if (!formEl) return;

  const container = formEl.querySelector('.netlify-recaptcha');
  if (!container) return;

  const mo = new MutationObserver(() => {
    centerRecaptchaMobile();
  });

  mo.observe(container, { childList: true, subtree: true });
  window.addEventListener('resize', () => centerRecaptchaMobile(), { passive: true });
});

document.getElementById('year').textContent = new Date().getFullYear();
