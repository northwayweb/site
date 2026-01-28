// Minimal JS for contact form validation and feedback
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    status.textContent = '';
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
    status.textContent = 'Thank you! Your message has been received.';
    status.style.color = '#18405a';
    form.reset();
  });
}

// Scroll-based reveal animations
const revealElements = document.querySelectorAll(
  '.service-card, .demo-card, .pricing-item, section h2, section p, .industry-list, .steps'
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15
  }
);

revealElements.forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});
