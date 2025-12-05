// Email Service - Handles sending emails for password resets and notifications
const nodemailer = require('nodemailer');

// Create email transporter
function createTransporter() {
  // Support multiple email providers
  const emailProvider = process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || 'gmail';
  
  if (emailProvider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (emailProvider === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  } else {
    // Generic SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
}

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.resetUrl - Base URL for reset page
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string, attempts?: number }
 */
async function sendPasswordResetEmail({ email, name, resetToken, resetUrl }, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  try {
    const transporter = createTransporter();
    
    const resetLink = `${resetUrl}/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Bloom Buddies Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
            .code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We received a request to reset your password for the Bloom Buddies Dashboard. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="code">${resetLink}</p>
              
              <div class="warning">
                ⚠️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p>For security reasons, never share this link with anyone.</p>
              
              <p>Best regards,<br>
              Bloom Buddies Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies Dashboard</p>
              <p>If you have any questions, please contact your administrator</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

We received a request to reset your password for the Bloom Buddies Dashboard.

To reset your password, visit this link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
Bloom Buddies Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending password reset email (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying password reset email send in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendPasswordResetEmail({ email, name, resetToken, resetUrl }, retryCount + 1);
    }
    
    console.error(`🚫 FAILED to send password reset email after ${MAX_RETRIES + 1} attempts`);
    return { success: false, error: error.message, attempts: retryCount + 1 };
  }
}

/**
 * Send password change confirmation email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordChangedEmail({ email, name }) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Successfully Changed - Bloom Buddies Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              font-size: 48px;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <div class="success-icon">🔒</div>
              
              <p>Hi ${name},</p>
              
              <p>Your password for the Bloom Buddies Dashboard has been successfully changed.</p>
              
              <p>If you made this change, no further action is required.</p>
              
              <p><strong>If you did not change your password,</strong> please contact your administrator immediately as your account may be compromised.</p>
              
              <p>Best regards,<br>
              Bloom Buddies Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies Dashboard</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Your password for the Bloom Buddies Dashboard has been successfully changed.

If you made this change, no further action is required.

If you did not change your password, please contact your administrator immediately.

Best regards,
Bloom Buddies Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password changed confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    return false;
  }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} - Success status
 */
async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

/**
 * Send interview confirmation email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.interviewDate - Interview date (YYYY-MM-DD)
 * @param {string} options.interviewTime - Interview time (HH:MM)
 * @returns {Promise<boolean>} - Success status
 */
/**
 * Send interview confirmation with retry logic
 * @param {Object} options - Email options
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<boolean>} - Success status
 */
async function sendInterviewConfirmation({ email, name, interviewDate, interviewTime, interviewLink, managementLink }, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  try {
    const transporter = createTransporter();
    
    // interviewDate and interviewTime are already formatted strings from the backend
    const formattedDate = interviewDate;
    const formattedTime = interviewTime;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Interview Confirmed - Bloom Buddies',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .interview-details {
              background: #f0fdf4;
              border-left: 4px solid #48bb78;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .interview-details h2 {
              margin: 0 0 10px 0;
              color: #22543d;
              font-size: 18px;
            }
            .detail-row {
              display: flex;
              margin: 8px 0;
              font-size: 16px;
            }
            .detail-label {
              font-weight: 600;
              color: #2d3748;
              min-width: 80px;
            }
            .detail-value {
              color: #4a5568;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .info-box {
              background: #e6fffa;
              border-left: 4px solid #319795;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Interview Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Great news! Your interview with Bloom Buddies has been successfully scheduled.</p>
              
              <div class="interview-details">
                <h2>Interview Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formattedTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">Approximately 30 minutes</span>
                </div>
              </div>
              
              <div class="info-box">
                <strong>📞 Your Interview Link:</strong><br>
                On the day of your interview, click the button below to start your phone interview:<br><br>
                <a href="${interviewLink}" style="display: inline-block; padding: 12px 24px; background: #48bb78; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
                  🎙️ Start My Interview
                </a>
              </div>
              
              <p><strong>What to prepare:</strong></p>
              <ul>
                <li>Review your application and resume</li>
                <li>Have a pen and paper ready for notes</li>
                <li>Be in a quiet location with good phone reception</li>
                <li>Click the interview link at the scheduled time</li>
                <li>Allow extra time in case the interview runs longer</li>
              </ul>
              
              <p><strong>Important:</strong> Please save this email with your interview link. You will need it on ${formattedDate} at ${formattedTime}.</p>
              
              ${managementLink ? `
              <div class="info-box" style="background: #fff7ed; border-left-color: #f97316;">
                <strong>📅 Need to Reschedule or Cancel?</strong><br>
                You can manage your interview anytime using this link:<br><br>
                <a href="${managementLink}" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 8px;">
                  Manage My Interview
                </a>
              </div>
              ` : `
              <p>If you need to reschedule for any reason, please contact us as soon as possible at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
              `}
              
              <p>We're looking forward to speaking with you!</p>
              
              <p>Best regards,<br>
              <strong>The Bloom Buddies Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies.</p>
              <p>If you have any questions, please reply to this email or contact us at ${process.env.EMAIL_FROM}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Your interview with Bloom Buddies has been confirmed!

Interview Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Duration: Approximately 30 minutes

You will receive a phone call at the scheduled time. Please ensure you're in a quiet location.

What to prepare:
- Review your application and resume
- Have a pen and paper ready for notes
- Be in a quiet location with good reception

If you need to reschedule, please contact us at ${process.env.EMAIL_FROM}.

We look forward to speaking with you!

Best regards,
The Bloom Buddies Team
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Interview confirmation email sent successfully to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending interview confirmation email (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying email send in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendInterviewConfirmation({ email, name, interviewDate, interviewTime, interviewLink }, retryCount + 1);
    }
    
    // All retries failed
    console.error(`🚫 FAILED to send interview confirmation email after ${MAX_RETRIES + 1} attempts`);
    return { success: false, error: error.message, attempts: retryCount + 1 };
  }
}

/**
 * Send cancellation confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} params.name - Candidate name
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Result object with success status
 */
async function sendCancellationConfirmation({ email, name }, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Interview Cancelled - Bloom Buddies',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .info-box {
              background: #e6fffa;
              border-left: 4px solid #319795;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We've received your request to cancel your interview with Bloom Buddies. Your interview has been successfully cancelled.</p>
              
              <div class="info-box">
                <strong>Changed your mind?</strong><br>
                If you'd like to reschedule or discuss other opportunities with us, we'd love to hear from you! Simply reply to this email or contact us at ${process.env.EMAIL_FROM}.
              </div>
              
              <p>We appreciate your interest in Bloom Buddies and wish you all the best in your job search.</p>
              
              <p>Best regards,<br>
              <strong>The Bloom Buddies Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bloom Buddies.</p>
              <p>If you have any questions, please reply to this email or contact us at ${process.env.EMAIL_FROM}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

We've received your request to cancel your interview with Bloom Buddies. Your interview has been successfully cancelled.

Changed your mind?
If you'd like to reschedule or discuss other opportunities with us, we'd love to hear from you! Simply reply to this email or contact us at ${process.env.EMAIL_FROM}.

We appreciate your interest in Bloom Buddies and wish you all the best in your job search.

Best regards,
The Bloom Buddies Team
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation confirmation email sent successfully to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending cancellation email (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying email send in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendCancellationConfirmation({ email, name }, retryCount + 1);
    }
    
    return {
      success: false,
      error: error.message,
      attempts: retryCount + 1
    };
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  testEmailConfig,
  sendInterviewConfirmation,
  sendCancellationConfirmation,
};
