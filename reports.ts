import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const reportsRouter = router({
  getReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        reportType: z.enum(["daily", "weekly", "monthly"]).optional(),
        status: z.enum(["draft", "scheduled", "sent"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Return mock reports
      return [
        {
          id: 1,
          name: "Daily Sales Report - 03/03/2026",
          reportType: "daily",
          generatedDate: new Date("2026-03-03T23:59:00"),
          period: { start: new Date("2026-03-03"), end: new Date("2026-03-03") },
          totalSales: 1500000,
          totalExpenses: 450000,
          netProfit: 1050000,
          status: "sent",
          sentTo: ["admin@karzjuice.com"],
          sentDate: new Date("2026-03-04T00:05:00"),
        },
        {
          id: 2,
          name: "Weekly Summary - Week of 02/24/2026",
          reportType: "weekly",
          generatedDate: new Date("2026-03-02T23:59:00"),
          period: { start: new Date("2026-02-24"), end: new Date("2026-03-02") },
          totalSales: 8500000,
          totalExpenses: 2550000,
          netProfit: 5950000,
          status: "sent",
          sentTo: ["admin@karzjuice.com", "finance@karzjuice.com"],
          sentDate: new Date("2026-03-03T08:00:00"),
        },
        {
          id: 3,
          name: "Monthly Report - February 2026",
          reportType: "monthly",
          generatedDate: new Date("2026-03-01T23:59:00"),
          period: { start: new Date("2026-02-01"), end: new Date("2026-02-28") },
          totalSales: 35000000,
          totalExpenses: 10500000,
          netProfit: 24500000,
          status: "sent",
          sentTo: ["admin@karzjuice.com"],
          sentDate: new Date("2026-03-01T08:00:00"),
        },
      ];
    }),

  generateReport: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["daily", "weekly", "monthly"]),
        dateRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
        includeDetails: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `${input.reportType} report generated`,
        reportId: `report-${Date.now()}`,
        reportType: input.reportType,
        status: "draft",
        generatedDate: new Date(),
      };
    }),

  scheduleReport: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["daily", "weekly", "monthly"]),
        frequency: z.enum(["once", "recurring"]),
        schedule: z.object({
          time: z.string(),
          day: z.string().optional(),
        }),
        recipients: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Report schedule created",
        scheduleId: `schedule-${Date.now()}`,
        reportType: input.reportType,
        frequency: input.frequency,
        recipients: input.recipients,
      };
    }),

  getReportById: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.reportId,
        name: "Daily Sales Report - 03/03/2026",
        reportType: "daily",
        generatedDate: new Date("2026-03-03T23:59:00"),
        period: { start: new Date("2026-03-03"), end: new Date("2026-03-03") },
        summary: {
          totalSales: 1500000,
          totalExpenses: 450000,
          netProfit: 1050000,
          transactionCount: 125,
        },
        breakdown: {
          salesByProduct: [
            { product: "Fresh Juice", amount: 800000, count: 60 },
            { product: "Smoothies", amount: 500000, count: 40 },
            { product: "Blended Drinks", amount: 200000, count: 25 },
          ],
          expensesByCategory: [
            { category: "Ingredients", amount: 200000 },
            { category: "Utilities", amount: 150000 },
            { category: "Labor", amount: 100000 },
          ],
        },
        status: "sent",
        sentTo: ["admin@karzjuice.com"],
        sentDate: new Date("2026-03-04T00:05:00"),
      };
    }),

  sendReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        recipients: z.array(z.string().email()),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Report sent to ${input.recipients.length} recipient(s)`,
        reportId: input.reportId,
        sentTo: input.recipients,
        sentDate: new Date(),
      };
    }),

  exportReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        format: z.enum(["pdf", "excel", "csv"]),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Report exported as ${input.format}`,
        fileUrl: `/exports/report-${input.reportId}.${input.format}`,
        fileName: `report-${input.reportId}.${input.format}`,
      };
    }),

  getScheduledReports: protectedProcedure.query(async () => {
    return [
      {
        id: 1,
        reportType: "daily",
        frequency: "recurring",
        schedule: {
          time: "06:00",
          day: "Every day",
        },
        recipients: ["admin@karzjuice.com"],
        lastSent: new Date("2026-03-03T06:00:00"),
        nextSend: new Date("2026-03-04T06:00:00"),
        status: "active",
      },
      {
        id: 2,
        reportType: "weekly",
        frequency: "recurring",
        schedule: {
          time: "08:00",
          day: "Monday",
        },
        recipients: ["admin@karzjuice.com", "finance@karzjuice.com"],
        lastSent: new Date("2026-03-03T08:00:00"),
        nextSend: new Date("2026-03-10T08:00:00"),
        status: "active",
      },
      {
        id: 3,
        reportType: "monthly",
        frequency: "recurring",
        schedule: {
          time: "08:00",
          day: "1st of month",
        },
        recipients: ["admin@karzjuice.com"],
        lastSent: new Date("2026-03-01T08:00:00"),
        nextSend: new Date("2026-04-01T08:00:00"),
        status: "active",
      },
    ];
  }),
});
