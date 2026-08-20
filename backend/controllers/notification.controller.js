// backend/src/controllers/notification.controller.js
import Notification from '../models/communication/Notification.js';
import nodemailer from 'nodemailer';

let transporter = null;
let emailConfigured = false;

// Create email transporter
const createTransporter = async () => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;


    if (!emailUser || !emailPassword) {
      console.error('❌ Email credentials missing in .env');
      emailConfigured = false;
      return null;
    }

    if (!emailUser.includes('@gmail.com')) {
      console.error('❌ EMAIL_USER must be a Gmail account (@gmail.com)');
      emailConfigured = false;
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    await new Promise((resolve) => {
      transporter.verify((error) => {
        if (error) {
          console.error('❌ Email verification failed:', error.message);
          emailConfigured = false;
        } else {
          emailConfigured = true;
        }
        resolve();
      });
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    emailConfigured = false;
    return null;
  }
};

// Send email function with better error handling
const sendNotificationEmail = async (to, subject, html) => {
  try {
    if (!emailConfigured || !transporter) {
      await createTransporter();
      if (!transporter || !emailConfigured) {
        console.error('❌ Email still not configured after retry');
        return { success: false, error: 'Email not configured' };
      }
    }

    const mailOptions = {
      from: {
        name: 'ScholarOS — Office of Student & Staff Communications',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================== EMAIL TEMPLATE HELPERS ====================

// The sender identity shown in the email. Falls back to a default office
// name if the notification doesn't carry a specific sender.
const getSenderName = (notification) =>
  notification.senderName ||
  notification.sender ||
  notification.createdBy ||
  'ScholarOS Administration';

// ✅ Minimal Official Notification Email — shows only: From, Title, Message
// (polished visual treatment: card shadow, monogram avatar, refined type)
const generateEmailHTML = (notification) => {
  const senderName = getSenderName(notification);
  const initials = senderName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SA';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ScholarOS Notification</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background: #e9edf3;
          padding: 40px 16px;
          -webkit-font-smoothing: antialiased;
        }
        .outer {
          max-width: 560px;
          margin: 0 auto;
        }

        /* ---- Top brand strip ---- */
        .brand-strip {
          text-align: center;
          padding-bottom: 22px;
        }
        .brand-mark {
          display: inline-flex;
          align-items: center;
          gap: 9px;
        }
        .brand-crest {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: linear-gradient(150deg, #1f3a5f 0%, #0e2038 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .brand-crest span {
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          font-family: Georgia, serif;
        }
        .brand-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.6px;
          color: #1f3a5f;
          text-transform: uppercase;
        }

        /* ---- Card ---- */
        .card {
          background: #ffffff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px rgba(16, 24, 40, 0.08);
        }

        .card-header {
          background: linear-gradient(135deg, #1f3a5f 0%, #16304f 55%, #0e2038 100%);
          padding: 30px 40px 26px;
          position: relative;
        }
        .card-header::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 4px;
          background: linear-gradient(90deg, #c9a24b, #e6c877 50%, #c9a24b);
        }
        .header-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 12px;
        }
        .sender-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }
        .sender-name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1px;
        }
        .sender-sub {
          font-size: 11.5px;
          color: rgba(255,255,255,0.6);
          margin-top: 1px;
        }

        .card-body {
          padding: 38px 40px 36px;
        }
        .notification-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 23px;
          font-weight: 700;
          color: #12213a;
          line-height: 1.4;
          margin-bottom: 20px;
        }
        .rule {
          width: 44px;
          height: 3px;
          background: #c9a24b;
          border-radius: 2px;
          margin-bottom: 22px;
        }
        .notification-message {
          font-size: 15px;
          color: #3c4758;
          line-height: 1.85;
          white-space: pre-line;
        }

        .card-footer {
          padding: 18px 40px;
          background: #f7f8fa;
          border-top: 1px solid #eef0f3;
          text-align: center;
        }
        .card-footer p {
          font-size: 11px;
          color: #97a1af;
          letter-spacing: 0.2px;
        }

        .outer-footer {
          text-align: center;
          padding-top: 22px;
        }
        .outer-footer p {
          font-size: 11px;
          color: #97a1af;
        }

        @media (max-width: 480px) {
          .card-header, .card-body, .card-footer { padding-left: 24px; padding-right: 24px; }
          .notification-title { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="outer">

        <div class="brand-strip">
          <div class="brand-mark">
            <span class="brand-crest"><span>SO</span></span>
            <span class="brand-name">ScholarOS</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="header-label">Notification From</div>
            <div class="sender-row">
              <div class="avatar">${initials}</div>
              <div>
                <div class="sender-name">${senderName}</div>
                <div class="sender-sub">ScholarOS Notification System</div>
              </div>
            </div>
          </div>

          <div class="card-body">
            <h1 class="notification-title">${notification.title}</h1>
            <div class="rule"></div>
            <div class="notification-message">${notification.message}</div>
          </div>

          <div class="card-footer">
            <p>This is an official notification. Please do not reply to this email.</p>
          </div>
        </div>

        <div class="outer-footer">
          <p>&copy; ${new Date().getFullYear()} ScholarOS. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

// ✅ Official-Style Test / System Verification Email
const generateTestEmailHTML = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ScholarOS System Verification</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          line-height: 1.65;
          color: #1c1c1c;
          background-color: #eef0f3;
          padding: 24px 16px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #d7dbe0;
        }
        .letterhead {
          border-bottom: 3px solid #1f3a5f;
          padding: 28px 36px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .seal {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 2px solid #1f3a5f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #1f3a5f;
          flex-shrink: 0;
        }
        .letterhead-text .institution {
          font-size: 19px;
          font-weight: 700;
          color: #1f3a5f;
        }
        .letterhead-text .office {
          font-size: 12.5px;
          color: #5b6b73;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .content { padding: 32px 36px 28px; }
        .status-line {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #1f6f4c;
          margin-bottom: 6px;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          color: #1c1c1c;
          margin-bottom: 14px;
          border-left: 4px solid #1f6f4c;
          padding-left: 14px;
        }
        p.body-text {
          font-size: 14.5px;
          color: #2a2a2a;
          margin-bottom: 20px;
        }
        table.details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 8px;
        }
        table.details-table td {
          padding: 8px 0;
          border-bottom: 1px solid #e2e5ea;
        }
        table.details-table td.label {
          color: #5b6b73;
          width: 160px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.4px;
        }
        table.details-table td.value {
          color: #1c1c1c;
          font-weight: 600;
        }
        .footer {
          background: #f6f7f9;
          padding: 20px 36px;
          border-top: 1px solid #e2e5ea;
        }
        .footer p {
          font-size: 11px;
          color: #7c8790;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="letterhead">
          <div class="seal">SO</div>
          <div class="letterhead-text">
            <div class="institution">ScholarOS</div>
            <div class="office">System Administration</div>
          </div>
        </div>
        <div class="content">
          <div class="status-line">System Verification</div>
          <h1>Notification Delivery Test Successful</h1>
          <p class="body-text">
            This message confirms that the ScholarOS notification delivery system is
            correctly configured and operational for this institution's mailbox.
          </p>
          <table class="details-table">
            <tr>
              <td class="label">Verified On</td>
              <td class="value">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label">Recipient</td>
              <td class="value">{recipient}</td>
            </tr>
            <tr>
              <td class="label">System</td>
              <td class="value">ScholarOS Notification Service</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          <p>This is an automated system verification message from ScholarOS. No action is required.</p>
          <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} ScholarOS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const processNotificationEmailDelivery = async (notificationId, recipients, title) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      console.error(`⚠️ Notification ${notificationId} not found for background email delivery`);
      return;
    }

    const emailRecipients = recipients.length > 0
      ? recipients
      : [process.env.NOTIFICATION_EMAIL || 'samiahayat95@gmail.com'];

    const emailHTML = generateEmailHTML(notification);
    let deliveredCount = 0;
    let failedCount = 0;
    let emailError = null;

    for (const recipient of emailRecipients) {
      try {
        const result = await sendNotificationEmail(
          recipient,
          title,
          emailHTML
        );

        if (result.success) {
          deliveredCount += 1;
        } else {
          failedCount += 1;
          console.error(`❌ Failed to: ${recipient}`, result.error);
          if (!emailError) emailError = result.error;
        }
      } catch (err) {
        failedCount += 1;
        console.error(`❌ Error for ${recipient}:`, err.message);
        if (!emailError) emailError = err.message;
      }
    }

    await Notification.findByIdAndUpdate(notificationId, {
      deliveredCount,
      failedCount,
      status: deliveredCount > 0 ? 'sent' : 'failed',
      sentAt: new Date()
    });

  } catch (error) {
    console.error(`❌ Background email delivery failed for ${notificationId}:`, error.message);
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'failed',
      sentAt: new Date()
    });
  }
};

// ==================== CONTROLLER FUNCTIONS ====================

// Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ isArchived: false })
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments({ isArchived: false });
    const unread = await Notification.countDocuments({ isArchived: false, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      counts: { total, unread }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

// Update notification
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const notification = await Notification.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Create and send notification
export const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'announcement',
      channel = 'email',
      recipients = [],
      priority = 'medium',
      category = 'general',
      sendEmail: shouldSendEmail = true,
      senderName = req.user?.name || 'ScholarOS Administration'
    } = req.body;

    const normalizedRecipients = Array.isArray(recipients)
      ? recipients.map((recipient) => String(recipient).trim()).filter(Boolean)
      : typeof recipients === 'string'
        ? recipients.split(',').map((recipient) => recipient.trim()).filter(Boolean)
        : [];


    const notification = new Notification({
      title,
      message,
      type,
      channel,
      recipients: normalizedRecipients,
      recipientCount: normalizedRecipients.length || 1,
      priority,
      category,
      senderName,
      status: 'pending'
    });

    await notification.save();

    let emailResult = null;
    let emailError = null;

    if (shouldSendEmail && (channel === 'email' || channel === 'all')) {
      const emailRecipients = normalizedRecipients.length > 0
        ? normalizedRecipients
        : [process.env.NOTIFICATION_EMAIL || 'samiahayat95@gmail.com'];

      notification.status = 'pending';
      notification.sentAt = new Date();
      await notification.save();

      void processNotificationEmailDelivery(notification._id.toString(), emailRecipients, title);

      emailResult = {
        delivered: 0,
        failed: 0
      };
    } else {
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
    }

    res.status(201).json({
      success: true,
      data: notification,
      email: emailResult,
      emailError: emailError || null,
      message: shouldSendEmail && (channel === 'email' || channel === 'all')
        ? 'Notification created and email delivery is being processed'
        : 'Notification created and sent successfully'
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Mark as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message
    });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
};

// Get notification stats
export const getNotificationStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments({ isArchived: false });
    const unread = await Notification.countDocuments({ isArchived: false, isRead: false });
    const sent = await Notification.countDocuments({ isArchived: false, status: 'sent' });
    const pending = await Notification.countDocuments({ isArchived: false, status: 'pending' });
    const failed = await Notification.countDocuments({ isArchived: false, status: 'failed' });

    res.status(200).json({
      success: true,
      data: { total, unread, sent, pending, failed }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// Send test email
export const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || process.env.NOTIFICATION_EMAIL || 'samiahayat95@gmail.com';


    if (!emailConfigured || !transporter) {
      await createTransporter();
    }

    if (!transporter || !emailConfigured) {
      return res.status(200).json({
        success: false,
        message: 'Email not configured. Please check your .env file',
        warning: true
      });
    }

    // Replace recipient placeholder in template
    let emailHTML = generateTestEmailHTML();
    emailHTML = emailHTML.replace(/\{recipient\}/g, testEmail);

    const result = await sendNotificationEmail(
      testEmail,
      'ScholarOS — Notification System Verification',
      emailHTML
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

// Get email status
export const getEmailStatus = (req, res) => {
  res.status(200).json({
    success: true,
    configured: emailConfigured,
    email: process.env.EMAIL_USER || 'not set',
    notificationEmail: process.env.NOTIFICATION_EMAIL || 'not set'
  });
};

// Initialize transporter
createTransporter();