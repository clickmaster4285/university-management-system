// backend/src/controllers/notification.controller.js
import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';

let transporter = null;
let emailConfigured = false;

// Create email transporter
const createTransporter = async () => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    console.log('📧 EMAIL_USER:', emailUser);
    console.log('📧 EMAIL_PASSWORD:', emailPassword ? '✅ Set' : '❌ Not Set');

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
          console.log('✅ Email transporter ready!');
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
    // If email is not configured, try to configure it
    if (!emailConfigured || !transporter) {
      console.log('🔄 Configuring email transporter...');
      await createTransporter();
      if (!transporter || !emailConfigured) {
        console.error('❌ Email still not configured after retry');
        return { success: false, error: 'Email not configured' };
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    };

    console.log(`📧 Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent! ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

// Generate email HTML
const generateEmailHTML = (notification) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 26px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .notification-card { background: white; padding: 24px; border-radius: 10px; border-left: 5px solid #6366f1; }
        .priority-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #6366f1; color: white; }
        .footer { margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 ScholarOS Notification</h1>
        </div>
        <div class="content">
          <div class="notification-card">
            <span class="priority-badge">${notification.priority.toUpperCase()}</span>
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p><strong>Category:</strong> ${notification.category}</p>
            <p><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from ScholarOS.</p>
          </div>
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
          `📢 ${title} - ScholarOS Notification`,
          emailHTML
        );

        if (result.success) {
          deliveredCount += 1;
          console.log(`✅ Delivered to: ${recipient}`);
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

    console.log(`📦 Background email delivery finished for ${notificationId}:`, { deliveredCount, failedCount, emailError });
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

// ✅ FIXED: Create and send notification
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
      sendEmail: shouldSendEmail = true
    } = req.body;

    const normalizedRecipients = Array.isArray(recipients)
      ? recipients.map((recipient) => String(recipient).trim()).filter(Boolean)
      : typeof recipients === 'string'
        ? recipients.split(',').map((recipient) => recipient.trim()).filter(Boolean)
        : [];

    console.log('📝 Creating notification:', { title, message, normalizedRecipients, shouldSendEmail });

    // Create notification - always save first
    const notification = new Notification({
      title,
      message,
      type,
      channel,
      recipients: normalizedRecipients,
      recipientCount: normalizedRecipients.length || 1,
      priority,
      category,
      status: 'pending'
    });

    await notification.save();
    console.log('✅ Notification saved:', notification._id);

    let emailResult = null;
    let emailError = null;

    // Queue email delivery in the background so the request returns immediately
    if (shouldSendEmail && (channel === 'email' || channel === 'all')) {
      const emailRecipients = normalizedRecipients.length > 0
        ? normalizedRecipients
        : [process.env.NOTIFICATION_EMAIL || 'samiahayat95@gmail.com'];
      console.log(`📧 Queuing email delivery to:`, emailRecipients);

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
      console.log('✅ Notification marked as sent (email not sent)');
    }

    // ✅ Always return success quickly, even if email delivery is still processing
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

    console.log(`📧 Sending test email to: ${testEmail}`);

    // Configure email if not already
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

    const result = await sendNotificationEmail(
      testEmail,
      '✅ ScholarOS Test Email',
      `
        <h1>✅ Test Email</h1>
        <p>This is a test email from ScholarOS.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>To:</strong> ${testEmail}</p>
        <p>If you received this, your email is working!</p>
      `
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Test email sent to ${testEmail}`
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