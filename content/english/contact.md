---
title: "Contact Q C Grant Ltd."
description: "Get in touch with Q C Grant Ltd. for cybersecurity, managed IT, and technology consulting services. Based in Roseau, Dominica, serving the Caribbean."
draft: false
---

## Get In Touch

**Ready to enhance your cybersecurity posture or modernize your IT infrastructure? Let's discuss your needs.**

---

### Contact Form

<form id="contactForm" class="needs-validation" novalidate>
  <div class="form-group mb-3">
    <label for="name" class="form-label">Full Name *</label>
    <input type="text" class="form-control" id="name" name="name" required />
    <div class="invalid-feedback">Please enter your name.</div>
  </div>

  <div class="form-group mb-3">
    <label for="company" class="form-label">Company / Organization</label>
    <input type="text" class="form-control" id="company" name="company" />
  </div>

  <div class="form-group mb-3">
    <label for="email" class="form-label">Email Address *</label>
    <input type="email" class="form-control" id="email" name="email" required />
    <div class="invalid-feedback">Please enter a valid email address.</div>
  </div>

  <div class="form-group mb-3">
    <label for="phone" class="form-label">Phone Number</label>
    <input type="tel" class="form-control" id="phone" name="phone" />
  </div>

  <div class="form-group mb-3">
    <label for="service" class="form-label">Service Interest</label>
    <select class="form-select" id="service" name="service">
      <option value="">-- Please Select --</option>
      <option value="cybersecurity">Cybersecurity Services</option>
      <option value="managed-it">Managed IT Services</option>
      <option value="cloud-ai">Cloud & AI Services</option>
      <option value="consulting">IT Consulting & ERPNext</option>
      <option value="assessment">Security Assessment</option>
      <option value="other">Other / General Inquiry</option>
    </select>
  </div>

  <div class="form-group mb-3">
    <label for="message" class="form-label">Message *</label>
    <textarea class="form-control" id="message" name="message" rows="6" required></textarea>
    <div class="invalid-feedback">Please enter your message.</div>
  </div>

  <!-- Honeypot field (hidden from users, catches bots) -->
  <input type="text" id="website" name="honeypot" style="display:none" tabindex="-1" autocomplete="off" />

  <div class="form-check mb-3">
    <input class="form-check-input" type="checkbox" id="requestCallback" name="requestCallback" value="yes" />
    <label class="form-check-label text-dark" for="requestCallback" style="font-weight: 400;">
      I'd like to request a Sales callback
    </label>
  </div>

  <div class="form-check mb-3">
    <input class="form-check-input" type="checkbox" id="marketingConsent" name="marketingConsent" value="yes" />
    <label class="form-check-label text-dark" for="marketingConsent" style="font-weight: 400;">
      Yes! I would like to receive marketing communications from Q C Grant including special offers, articles and other content relating to IT and cyber security. I may unsubscribe at any time.
    </label>
  </div>

  <div id="formStatus" class="alert d-none" role="alert"></div>

  <button type="submit" class="btn btn-primary" id="submitBtn">
    <span class="btn-text">Send Message</span>
    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
  </button>
</form>

<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner-border');
  const formStatus = document.getElementById('formStatus');
  
  // Validate form
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  // Disable button and show loading
  submitBtn.disabled = true;
  btnText.textContent = 'Sending...';
  spinner.classList.remove('d-none');
  formStatus.classList.add('d-none');
  
  // Collect form data
  const formData = {
    name: document.getElementById('name').value,
    company: document.getElementById('company').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    service: document.getElementById('service').value,
    message: document.getElementById('message').value,
    requestCallback: document.getElementById('requestCallback').checked,
    marketingConsent: document.getElementById('marketingConsent').checked,
    honeypot: document.getElementById('website').value
  };
  
  try {
    // Determine the API endpoint based on current location
    const apiEndpoint = window.location.port === '8080' 
      ? `${window.location.protocol}//${window.location.hostname}:8080`
      : 'http://10.147.17.62:8080';
    
    const response = await fetch(`${apiEndpoint}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get text and show generic error
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid server response. Please contact us directly at support@qcgrant.com');
    }
    
    if (response.ok) {
      formStatus.className = 'alert alert-success';
      formStatus.textContent = data.message || 'Message sent successfully!';
      formStatus.classList.remove('d-none');
      form.reset();
      form.classList.remove('was-validated');
    } else {
      throw new Error(data.error || 'Failed to send message');
    }
  } catch (error) {
    formStatus.className = 'alert alert-danger';
    formStatus.textContent = error.message || 'Failed to send message. Please try again or contact us directly at support@qcgrant.com';
    formStatus.classList.remove('d-none');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Send Message';
    spinner.classList.add('d-none');
  }
});
</script>

---

### Contact Information

**Q C Grant Ltd.**  
32 Kennedy Avenue  
Roseau, Dominica

**Phone:** +1 767 275 3290  
**Email:** support@qcgrant.com

**Business Hours:**  
Monday - Friday: 9:00 AM - 5:00 PM (AST)  
Saturday - Sunday: Closed

---

### Connect With Us

**LinkedIn:** [linkedin.com/in/charles-d-grant](https://www.linkedin.com/in/charles-d-grant/)

---

### Emergency Support

For existing managed services clients with **critical emergencies** outside business hours, please use the emergency contact number provided in your service agreement.

---

## Service Areas

While headquartered in Dominica, Q C Grant Ltd. serves organizations throughout the Caribbean region. Remote consulting and support available for all services.

**Primary Service Areas:**
- Dominica
- Caribbean Region (Remote & On-Site)
- International Clients (Remote Consulting)
