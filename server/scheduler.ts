import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './email';
import type { InvoiceWithClient } from '@shared/schema';

class ReminderScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduledJobs();
  }

  private initializeScheduledJobs() {
    // Check for due soon invoices every day at 9 AM
    const dueSoonJob = cron.schedule('0 9 * * *', async () => {
      await this.checkDueSoonInvoices();
    }, {
      scheduled: true,
      timezone: 'America/New_York' // Adjust timezone as needed
    });

    // Check for overdue invoices every day at 10 AM
    const overdueJob = cron.schedule('0 10 * * *', async () => {
      await this.checkOverdueInvoices();
    }, {
      scheduled: true,
      timezone: 'America/New_York' // Adjust timezone as needed
    });

    this.jobs.set('dueSoon', dueSoonJob);
    this.jobs.set('overdue', overdueJob);

    console.log('Email reminder scheduler initialized');
  }

  private async checkDueSoonInvoices() {
    if (!emailService.isConfigured()) {
      console.log('Email service not configured - skipping due soon reminders');
      return;
    }

    try {
      // Get all users to check their invoices
      const invoices = await this.getAllPendingInvoices();
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

      const dueSoonInvoices = invoices.filter(invoice => {
        const dueDate = new Date(invoice.dueDate);
        return dueDate <= threeDaysFromNow && dueDate > today && invoice.status === 'pending';
      });

      console.log(`Found ${dueSoonInvoices.length} invoices due soon`);

      for (const invoice of dueSoonInvoices) {
        try {
          await emailService.sendInvoiceReminder(invoice, 'due_soon');
          // Optionally update a reminder sent flag in the database
        } catch (error) {
          console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking due soon invoices:', error);
    }
  }

  private async checkOverdueInvoices() {
    if (!emailService.isConfigured()) {
      console.log('Email service not configured - skipping overdue reminders');
      return;
    }

    try {
      const invoices = await this.getAllPendingInvoices();
      const today = new Date();

      const overdueInvoices = invoices.filter(invoice => {
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today && invoice.status === 'pending';
      });

      console.log(`Found ${overdueInvoices.length} overdue invoices`);

      for (const invoice of overdueInvoices) {
        try {
          await emailService.sendInvoiceReminder(invoice, 'overdue');
          // Optionally update invoice status to 'overdue' or add overdue flag
        } catch (error) {
          console.error(`Failed to send overdue reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
    }
  }

  private async getAllPendingInvoices(): Promise<InvoiceWithClient[]> {
    // This is a simplified approach - in a real implementation, you might want to
    // iterate through users or maintain a separate table for reminders
    try {
      // For now, we'll need to modify storage to get all pending invoices
      // This is a limitation of the current user-based architecture
      const allInvoices: InvoiceWithClient[] = [];
      // Note: This would need to be implemented based on your user management system
      return allInvoices;
    } catch (error) {
      console.error('Error fetching all pending invoices:', error);
      return [];
    }
  }

  // Manual trigger methods for testing
  async triggerDueSoonCheck() {
    await this.checkDueSoonInvoices();
  }

  async triggerOverdueCheck() {
    await this.checkOverdueInvoices();
  }

  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} reminder job`);
    });
    this.jobs.clear();
  }

  start() {
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started ${name} reminder job`);
    });
  }

  getStatus() {
    return {
      emailConfigured: emailService.isConfigured(),
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }
}

export const reminderScheduler = new ReminderScheduler();