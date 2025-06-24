import nodemailer from 'nodemailer';
import type { InvoiceWithClient } from '@shared/schema';

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email credentials are available
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailUser || !emailPass) {
      console.log('Email service not configured - missing environment variables');
      return;
    }

    const config: EmailConfig = {
      host: emailHost,
      port: emailPort ? parseInt(emailPort) : 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendInvoiceReminder(invoice: InvoiceWithClient, reminderType: 'due_soon' | 'overdue'): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured - cannot send reminder');
      return false;
    }

    try {
      const subject = reminderType === 'due_soon' 
        ? `Payment Reminder: Invoice #${invoice.invoiceNumber} Due Soon`
        : `Overdue Payment Notice: Invoice #${invoice.invoiceNumber}`;

      const dueDate = new Date(invoice.dueDate).toLocaleDateString();
      const amount = `$${invoice.total.toFixed(2)}`;

      const emailBody = this.generateReminderEmail(invoice, reminderType, dueDate, amount);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: invoice.client.email,
        subject: subject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Reminder email sent for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send email reminder:', error);
      return false;
    }
  }

  private generateReminderEmail(invoice: InvoiceWithClient, reminderType: 'due_soon' | 'overdue', dueDate: string, amount: string): string {
    const isOverdue = reminderType === 'overdue';
    const urgencyClass = isOverdue ? 'color: #dc2626;' : 'color: #ea580c;';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; border-left: 4px solid ${isOverdue ? '#dc2626' : '#ea580c'};">
            <h1 style="margin: 0 0 20px 0; ${urgencyClass}">
              ${isOverdue ? 'Overdue Payment Notice' : 'Payment Reminder'}
            </h1>
            
            <p style="margin: 0 0 15px 0;">Dear ${invoice.client.name},</p>
            
            <p style="margin: 0 0 15px 0;">
              ${isOverdue 
                ? `This is a notice that your payment for Invoice #${invoice.invoiceNumber} is now overdue.`
                : `This is a friendly reminder that your payment for Invoice #${invoice.invoiceNumber} is due soon.`
              }
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937;">Invoice Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Number:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">#${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount Due:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: bold; ${urgencyClass}">${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; ${isOverdue ? urgencyClass : ''}">${dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${isOverdue ? '#fef2f2' : '#fef3c7'}; color: ${isOverdue ? '#dc2626' : '#d97706'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                      ${isOverdue ? 'OVERDUE' : 'DUE SOON'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            ${invoice.lineItems.length > 0 ? `
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">Services Provided</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${invoice.lineItems.map(item => `
                    <tr>
                      <td style="padding: 5px 0; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
                      <td style="padding: 5px 0; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
                      <td style="padding: 5px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">$${item.rate.toFixed(2)}</td>
                      <td style="padding: 5px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">$${(item.quantity * parseFloat(item.rate.toString())).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            ` : ''}
            
            <p style="margin: 20px 0 15px 0;">
              ${isOverdue 
                ? 'Please arrange payment as soon as possible to avoid any service interruptions.'
                : 'Please ensure payment is made by the due date to avoid any late fees.'
              }
            </p>
            
            <p style="margin: 0 0 15px 0;">
              If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us.
            </p>
            
            <p style="margin: 20px 0 0 0;">
              Best regards,<br>
              <strong>Your Business Name</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  async sendInvoice(invoice: InvoiceWithClient): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured - cannot send invoice');
      return false;
    }

    try {
      const subject = `Invoice #${invoice.invoiceNumber} from Your Business`;
      const dueDate = new Date(invoice.dueDate).toLocaleDateString();
      const amount = `$${invoice.total.toFixed(2)}`;

      const emailBody = this.generateInvoiceEmail(invoice, dueDate, amount);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: invoice.client.email,
        subject: subject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Invoice email sent for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  private generateInvoiceEmail(invoice: InvoiceWithClient, dueDate: string, amount: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Invoice</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; border-left: 4px solid #059669;">
            <h1 style="margin: 0 0 20px 0; color: #059669;">New Invoice</h1>
            
            <p style="margin: 0 0 15px 0;">Dear ${invoice.client.name},</p>
            
            <p style="margin: 0 0 15px 0;">
              Thank you for your business! Please find the details of your new invoice below.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937;">Invoice Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Number:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">#${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                      PENDING
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            ${invoice.lineItems.length > 0 ? `
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">Services Provided</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Rate</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.lineItems.map(item => `
                      <tr>
                        <td style="padding: 8px 10px; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
                        <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #f3f4f6;">${item.quantity}</td>
                        <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">$${item.rate.toFixed(2)}</td>
                        <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #f3f4f6; font-weight: 600;">$${(item.quantity * parseFloat(item.rate.toString())).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            <p style="margin: 20px 0 15px 0;">
              Payment is due by ${dueDate}. Please contact us if you have any questions about this invoice.
            </p>
            
            <p style="margin: 20px 0 0 0;">
              Thank you for your business!<br>
              <strong>Your Business Name</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>If you have any questions, please contact us.</p>
          </div>
        </body>
      </html>
    `;
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}

export const emailService = new EmailService();