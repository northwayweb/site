// ===============================
// Contact Form (client-side feedback only)
// ===============================
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const messageField = document.getElementById('message');
const messageCount = document.getElementById('message-count');
const MAX_MESSAGE_CHARS = 500;

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
    e.preventDefault();
    status.textContent = '';
    status.style.color = '';

    const name = form.name.value.trim();
    const business = form.business.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !business || !email || !message) {
      status.textContent = 'Please fill in all fields.';
      status.style.color = '#c00';
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      status.textContent = 'Please enter a valid email address.';
      status.style.color = '#c00';
      return;
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      status.textContent = `Message must be ${MAX_MESSAGE_CHARS} characters or less.`;
      status.style.color = '#c00';
      return;
    }

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

document.getElementById('year').textContent = new Date().getFullYear();
