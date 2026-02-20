import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserClinicId } from "@/lib/clinic";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clinicId = await getUserClinicId(session.user.id);
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic assigned" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    const where: Prisma.InvoiceWhereInput = {
      clinicId,
    };

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate + "T23:59:59.999Z");
    }

    if (doctorId && doctorId !== "all") {
      where.issuedById = doctorId;
    }

    if (status && status !== "all") {
      const statusList = status.split(",") as Prisma.EnumInvoiceStatusFilter["in"];
      where.status = { in: statusList };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        issuedBy: {
          select: {
            name: true,
            specialty: true,
          },
        },
        items: true,
        payments: true,
      },
    });

    let totalRevenue = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let totalDiscounts = 0;
    let totalTax = 0;

    const statusStats: Record<string, { count: number; amount: number }> = {};
    const paymentMethodStats: Record<string, { count: number; amount: number }> = {};
    const dailyRevenue: Record<string, number> = {};
    const doctorRevenue: Record<string, number> = {};

    invoices.forEach((inv) => {
      const amount = Number(inv.total);
      const subtotal = Number(inv.subtotal);
      const tax = Number(inv.tax);
      const discount = Number(inv.discount || 0);

      totalRevenue += subtotal;
      totalTax += tax;
      totalDiscounts += discount;

      if (!statusStats[inv.status]) {
        statusStats[inv.status] = { count: 0, amount: 0 };
      }
      statusStats[inv.status].count++;
      statusStats[inv.status].amount += amount;

      if (inv.status === "PAID") {
        paidAmount += amount;
      } else if (inv.status === "PENDING" || inv.status === "PARTIAL") {
        pendingAmount += amount;
      }

      inv.payments.forEach((payment) => {
        const method = payment.method;
        const payAmount = Number(payment.amount);
        if (!paymentMethodStats[method]) {
          paymentMethodStats[method] = { count: 0, amount: 0 };
        }
        paymentMethodStats[method].count++;
        paymentMethodStats[method].amount += payAmount;
      });

      const dateKey = format(inv.issueDate, "yyyy-MM-dd");
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + amount;

      const doctorName = inv.issuedBy?.name || "No especificado";
      doctorRevenue[doctorName] = (doctorRevenue[doctorName] || 0) + amount;
    });

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id.toString(),
      invoiceNumber: inv.clinicInvoiceNumber,
      issueDate: inv.issueDate.toISOString(),
      dateFormatted: format(inv.issueDate, "dd/MM/yyyy", { locale: es }),
      patientName: `${inv.patient.firstName} ${inv.patient.middleName ? inv.patient.middleName + " " : ""}${inv.patient.lastName}`,
      doctorName: inv.issuedBy?.name || "No especificado",
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      discount: Number(inv.discount || 0),
      total: Number(inv.total),
      status: inv.status,
      itemsCount: inv.items.length,
      paymentsCount: inv.payments.length,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      summary: {
        totalInvoices: invoices.length,
        totalRevenue,
        totalTax,
        totalDiscounts,
        paidAmount,
        pendingAmount,
        averageInvoice: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        statusDistribution: Object.entries(statusStats).map(([label, data]) => ({
          label,
          count: data.count,
          amount: data.amount,
        })),
        paymentMethodDistribution: Object.entries(paymentMethodStats).map(([label, data]) => ({
          label,
          count: data.count,
          amount: data.amount,
        })),
        dailyRevenue: Object.entries(dailyRevenue)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        doctorRevenue: Object.entries(doctorRevenue)
          .map(([doctor, amount]) => ({ doctor, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
    });
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte financiero" },
      { status: 500 }
    );
  }
}
