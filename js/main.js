// ===============================
// Contact Form (client-side feedback only)
// ===============================
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

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

    status.textContent =
      'Thank you! Your message has been received. We will get back to you shortly.';
    status.style.color = '#18405a';

    form.reset();
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
