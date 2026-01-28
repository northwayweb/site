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
