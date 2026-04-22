/**
 * Notification Scheduler
 * Handles scheduling and sending of automated notifications
 */

import { EmailService, ReconciliationSummaryData, PaymentFailureData } from "./email-service";
import * as cronParser from "node-cron";

export interface ScheduledNotification {
  id: string;
  type: "daily_summary" | "payment_failure";
  cronExpression: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class NotificationScheduler {
  private emailService: EmailService;
  private scheduledJobs: Map<string, cronParser.ScheduledTask> = new Map();
  private isInitialized: boolean = false;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  /**
   * Initialize scheduler
   */
  async initialize(): Promise<void> {
    if (!this.emailService.isReady()) {
      console.warn("[Scheduler] Email service not configured, scheduler will not start");
      return;
    }

    this.isInitialized = true;
    console.log("[Scheduler] Notification scheduler initialized");
  }

  /**
   * Schedule daily reconciliation summary
   * Default: 9:00 AM daily
   */
  scheduleDailySummary(
    time: string, // HH:MM format
    recipients: string[],
    callback: () => Promise<ReconciliationSummaryData>
  ): void {
    if (!this.isInitialized) {
      console.warn("[Scheduler] Scheduler not initialized");
      return;
    }

    const [hour, minute] = time.split(":").map(Number);
    const cronExpression = `0 ${minute} ${hour} * * *`; // Every day at specified time

    const jobId = `daily-summary-${time}`;

    // Remove existing job if it exists
    if (this.scheduledJobs.has(jobId)) {
      const existingJob = this.scheduledJobs.get(jobId);
      if (existingJob) {
        existingJob.stop();
      }
      this.scheduledJobs.delete(jobId);
    }

    // Schedule new job
    const job = cronParser.schedule(cronExpression, async () => {
      try {
        console.log(`[Scheduler] Running daily summary at ${new Date().toISOString()}`);
        const data = await callback();

        const { subject, html, text } =
          this.emailService.generateReconciliationSummaryEmail(data);

        await this.emailService.sendEmail({
          to: recipients,
          subject,
          html,
          text,
        });

        console.log(`[Scheduler] Daily summary sent to ${recipients.join(", ")}`);
      } catch (error) {
        console.error("[Scheduler] Failed to send daily summary:", error);
      }
    });

    this.scheduledJobs.set(jobId, job);
    console.log(`[Scheduler] Daily summary scheduled for ${time}`);
  }

  /**
   * Schedule payment failure alerts
   * Sends immediately when a payment fails
   */
  async sendPaymentFailureAlert(
    data: PaymentFailureData,
    recipients: string[]
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn("[Scheduler] Scheduler not initialized");
      return;
    }

    try {
      const { subject, html, text } =
        this.emailService.generatePaymentFailureEmail(data);

      await this.emailService.sendEmail({
        to: recipients,
        subject,
        html,
        text,
      });

      console.log(`[Scheduler] Payment failure alert sent to ${recipients.join(", ")}`);
    } catch (error) {
      console.error("[Scheduler] Failed to send payment failure alert:", error);
    }
  }

  /**
   * Schedule unmatched transaction alert
   * Sends when unmatched transactions exceed threshold
   */
  async sendUnmatchedTransactionAlert(
    count: number,
    amount: number,
    currency: string,
    recipients: string[]
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn("[Scheduler] Scheduler not initialized");
      return;
    }

    try {
      const subject = `⚠️ Unmatched Transactions Alert - ${count} transactions`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; }
              .alert h2 { margin: 0 0 10px 0; color: #92400e; }
              .details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="alert">
                <h2>⚠️ Unmatched Transactions Alert</h2>
                <p>There are currently <strong>${count} unmatched transactions</strong> in the system.</p>
              </div>

              <div class="details">
                <p><strong>Total Amount:</strong> ${amount.toLocaleString()} ${currency}</p>
                <p>Please review these transactions and reconcile them as soon as possible.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const text = `
Unmatched Transactions Alert

There are currently ${count} unmatched transactions in the system.
Total Amount: ${amount.toLocaleString()} ${currency}

Please review these transactions and reconcile them as soon as possible.
      `;

      await this.emailService.sendEmail({
        to: recipients,
        subject,
        html,
        text,
      });

      console.log(
        `[Scheduler] Unmatched transaction alert sent to ${recipients.join(", ")}`
      );
    } catch (error) {
      console.error("[Scheduler] Failed to send unmatched transaction alert:", error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    this.scheduledJobs.forEach((job) => {
      job.stop();
    });
    this.scheduledJobs.clear();
    console.log("[Scheduler] All scheduled jobs stopped");
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledNotification[] {
    const jobs: ScheduledNotification[] = [];
    this.scheduledJobs.forEach((job, id) => {
      jobs.push({
        id,
        type: id.includes("daily-summary") ? "daily_summary" : "payment_failure",
        cronExpression: "",
        isActive: true,
        lastRun: undefined,
        nextRun: undefined,
      });
    });
    return jobs;
  }

  /**
   * Check if scheduler is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Create notification scheduler instance
 */
export function createNotificationScheduler(
  emailService: EmailService
): NotificationScheduler {
  return new NotificationScheduler(emailService);
}
