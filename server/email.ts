import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - email functionality disabled');
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hopeconnect.org';
const APP_NAME = 'HopeConnect';

export async function sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email Mock] Password reset email would be sent to ${email}`);
    console.log(`[Email Mock] Reset link: ${getBaseUrl()}/reset-password?token=${resetToken}`);
    return true;
  }

  const resetLink = `${getBaseUrl()}/reset-password?token=${resetToken}`;
  
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset Your ${APP_NAME} Password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Reset Your Password</h1>
          <p>Hi ${firstName},</p>
          <p>You requested to reset your password for your ${APP_NAME} account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email Mock] Welcome email would be sent to ${email}`);
    return true;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Welcome to ${APP_NAME}!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for joining our community of sponsors making a difference in children's lives.</p>
          <p>With your account, you can:</p>
          <ul>
            <li>Browse and sponsor children in need</li>
            <li>Track your sponsorships and payments</li>
            <li>Receive progress reports about your sponsored children</li>
          </ul>
          <a href="${getBaseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendSponsorshipConfirmationEmail(
  email: string,
  firstName: string,
  childName: string,
  amount: string,
  paymentType: string
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email Mock] Sponsorship confirmation email would be sent to ${email}`);
    return true;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Thank You for Sponsoring ${childName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Thank You for Your Generosity!</h1>
          <p>Hi ${firstName},</p>
          <p>Your sponsorship of <strong>${childName}</strong> has been confirmed!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Sponsorship Details:</strong></p>
            <p>Child: ${childName}</p>
            <p>Amount: $${amount}</p>
            <p>Type: ${paymentType === 'monthly' ? 'Monthly Recurring' : 'One-Time Contribution'}</p>
          </div>
          <p>You'll receive regular progress reports about ${childName}'s development.</p>
          <a href="${getBaseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Dashboard</a>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send sponsorship confirmation email:', error);
    return false;
  }
}

export async function sendNewReportEmail(
  email: string,
  firstName: string,
  childName: string,
  reportTitle: string
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email Mock] New report email would be sent to ${email}`);
    return true;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Progress Report for ${childName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">New Progress Report</h1>
          <p>Hi ${firstName},</p>
          <p>A new progress report has been posted for <strong>${childName}</strong>!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${reportTitle}</strong></p>
          </div>
          <a href="${getBaseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Read Full Report</a>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send new report email:', error);
    return false;
  }
}

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const client = getResend();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hopeconnect.org';
  
  if (!client) {
    console.log(`[Email Mock] Contact email from ${email}:`);
    console.log(`[Email Mock] Subject: ${subject}`);
    console.log(`[Email Mock] Message: ${message}`);
    return true;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      replyTo: email,
      subject: `[HopeConnect Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">New Contact Form Submission</h1>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 20px; color: #6c757d; font-size: 12px;">This message was sent via the HopeConnect contact form.</p>
        </div>
      `,
    });

    // Send confirmation to the user
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `We received your message - ${APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Thank You for Contacting Us!</h1>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

function getBaseUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  return 'http://localhost:5000';
}
