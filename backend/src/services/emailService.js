import nodemailer from 'nodemailer';

const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (
    !user ||
    !pass ||
    user === 'your_email@gmail.com' ||
    pass === 'your_app_password'
  ) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465 || process.env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[Email Mock] SMTP not configured. Mocking email To: ${to} | Subject: ${subject}`);
    return { mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Oral Health AI <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] Message sent to ${to} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}: ${error.message}`);
    return { error: true, message: error.message };
  }
};

export const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Oral Health AI',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (user, otp) => {
  const recipientName = user.name || user.pharmacyName || user.ownerName || 'User';

  return sendEmail({
    to: user.email,
    subject: 'Password Reset OTP - Oral Health AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0;">Oral Health AI</h1>
          <p style="color: #666; font-size: 14px;">Smart Oral Disease Detection & Telehealth</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <h2 style="color: #333333;">Password Reset Verification Code</h2>
        <p style="color: #555555; font-size: 15px;">Hello <strong>${recipientName}</strong>,</p>
        <p style="color: #555555; font-size: 15px;">You requested a password reset for your account. Please use the following 6-digit One-Time Password (OTP) to complete your password reset:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d9488; background-color: #f0fdf4; padding: 12px 28px; border: 2px dashed #0d9488; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #e11d48; font-size: 14px; font-weight: bold;">
          ⚠️ This OTP code is valid for 10 minutes only.
        </p>
        <p style="color: #777777; font-size: 13px;">
          If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized access.
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="color: #aaaaaa; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Oral Health AI. All rights reserved.
        </p>
      </div>
    `,
  });
};

export default { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
