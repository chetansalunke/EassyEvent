const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let htmlContent;

  // Generate HTML content based on template
  if (options.template === 'emailVerification') {
    htmlContent = generateEmailVerificationTemplate(options.data);
  } else if (options.template === 'passwordReset') {
    htmlContent = generatePasswordResetTemplate(options.data);
  } else {
    htmlContent = options.html || options.message;
  }

  // Message options
  const message = {
    from: `EassyEvent <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: htmlContent,
  };

  // Send email
  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

// Email verification template
const generateEmailVerificationTemplate = data => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - EassyEvent</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to EassyEvent!</h1>
            </div>
            <div class="content">
                <h2>Hello ${data.name},</h2>
                <p>Thank you for registering with EassyEvent! To complete your registration and start managing your venue bookings, please verify your email address.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">${data.verificationUrl}</p>
                <p>This verification link will expire in 24 hours.</p>
                <p>If you didn't create an account with EassyEvent, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 EassyEvent. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Password reset template
const generatePasswordResetTemplate = data => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - EassyEvent</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .warning { background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello ${data.name},</h2>
                <p>We received a request to reset your password for your EassyEvent account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${data.resetUrl}" class="button">Reset Password</a>
                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">${data.resetUrl}</p>
                <div class="warning">
                    <strong>Important:</strong> This password reset link will expire in 10 minutes for security reasons.
                </div>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 EassyEvent. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = sendEmail;
