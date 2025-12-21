require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required when behind Caddy reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:1313', 'http://10.147.17.62:1313'],
  methods: ['POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - 5 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' }
});

// Stricter rate limiting per email address
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour per email
  keyGenerator: (req) => req.body.email || req.ip,
  message: { error: 'Too many submissions from this email address. Please try again later.' }
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server ready');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Contact form endpoint
app.post('/api/contact', limiter, emailLimiter, async (req, res) => {
  try {
    const { name, company, email, phone, service, message, requestCallback, marketingConsent, honeypot } = req.body;

    // Honeypot check (bot detection)
    if (honeypot) {
      console.log(`Bot detected from IP ${req.ip}`);
      return res.status(400).json({ error: 'Invalid submission.' });
    }

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and message are required.' 
      });
    }

    // Length validation (prevent abuse)
    if (name.length > 100 || message.length > 5000 || email.length > 100) {
      return res.status(400).json({ error: 'Input too long.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Spam keyword detection
    const spamKeywords = ['viagra', 'casino', 'lottery', 'crypto wallet', 'bitcoin'];
    const contentLower = `${message} ${name}`.toLowerCase();
    if (spamKeywords.some(keyword => contentLower.includes(keyword))) {
      console.log(`Spam detected from ${email}`);
      return res.status(400).json({ error: 'Invalid content detected.' });
    }

    // Prepare email content
    const emailContent = `
New Contact Form Submission

Name: ${name}
Company: ${company || 'Not provided'}
Email: ${email}
Phone: ${phone || 'Not provided'}
Service Interest: ${service || 'Not specified'}
Sales Callback Requested: ${requestCallback ? 'Yes' : 'No'}
Marketing Consent: ${marketingConsent ? 'Yes' : 'No'}

Message:
${message}

---
Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Dominica' })}
IP: ${req.ip}
    `.trim();

    // Email options
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'support@qcgrant.com',
      replyTo: email,
      subject: `Contact Form: ${name} - ${service || 'General Inquiry'}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #08BCB0;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Company</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${company}</td>
            </tr>
            ` : ''}
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${phone}</td>
            </tr>
            ` : ''}
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Service Interest</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${service || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Sales Callback</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${requestCallback ? '<span style="color: #08BCB0; font-weight: bold;">✓ Yes</span>' : 'No'}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Marketing Consent</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${marketingConsent ? '<span style="color: #08BCB0; font-weight: bold;">✓ Yes</span>' : 'No'}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #08BCB0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Dominica' })}
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Optional: Send auto-reply to customer
    if (process.env.SEND_AUTO_REPLY === 'true') {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Thank you for contacting Q C Grant Ltd.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #08BCB0;">Thank You for Reaching Out!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will respond within 1-2 business days.</p>
            <p>Your inquiry regarding: <strong>${service || 'General inquiry'}</strong></p>
            <p>If you need immediate assistance, please call us at +1 767 275 3290.</p>
            <br>
            <p>Best regards,<br><strong>Q C Grant Ltd.</strong><br>Cybersecurity & IT Services</p>
          </div>
        `
      });
    }

    console.log(`Contact form submitted by ${email}`);
    res.json({ 
      success: true, 
      message: 'Your message has been sent successfully. We will contact you soon.' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again or contact us directly.' 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Contact API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});