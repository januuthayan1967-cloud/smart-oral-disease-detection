import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER === 'your_email@gmail.com' ||
    process.env.SMTP_PASS === 'your_app_password'
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return { mocked: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error(`Failed to send email to ${to}: ${error.message}`);
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

export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Oral Health AI',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    `,
  });
};

export default { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
