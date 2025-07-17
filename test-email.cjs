const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: 'dfd145078082d0',
    pass: 'f54f91de3e9781' // your real Mailtrap password
  }
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"CryptoPay OTP" <no-reply@cryptopay.com>',
      to: 'briman@example.com', // put any email — Mailtrap captures it
      subject: 'Test Email',
      text: 'This is a test email sent via Mailtrap SMTP'
    });
    console.log('Message sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send:', error);
  }
}

sendTestEmail();
