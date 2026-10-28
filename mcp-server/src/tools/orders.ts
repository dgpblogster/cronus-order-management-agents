/**
 * Order history tool handlers
 */

import { executeQuery } from "../db/connection.js";

interface OrderRecord {
  DocumentNo: string;
  CustomerNo: string;
  OrderDate: Date;
  PostingDate: Date;
  Amount: number;
  Status: string;
  SalespersonCode: string;
}

export async function handleGetOrderHistory(
  customerNo: string,
  limit: number = 10
): Promise<unknown> {
  const orders = await executeQuery<OrderRecord>(
    `SELECT TOP (@limit) DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode
     FROM OrderHistory
     WHERE CustomerNo = @customerNo
     ORDER BY OrderDate DESC`,
    { customerNo, limit }
  );

  if (orders.length === 0) {
    return {
      success: true,
      customer_no: customerNo,
      count: 0,
      orders: [],
      message: "No order history found for this customer",
    };
  }

  // Calculate summary statistics
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + o.Amount, 0);
  const avgOrderValue = totalValue / totalOrders;

  // Analyze order frequency if we have dates
  const orderDates = orders.map(o => new Date(o.OrderDate).getTime()).sort((a, b) => b - a);
  let avgDaysBetweenOrders: number | null = null;
  if (orderDates.length > 1) {
    const daysBetween = [];
    for (let i = 0; i < orderDates.length - 1; i++) {
      daysBetween.push((orderDates[i] - orderDates[i + 1]) / (1000 * 60 * 60 * 24));
    }
    avgDaysBetweenOrders = Math.round(daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length);
  }

  return {
    success: true,
    customer_no: customerNo,
    count: totalOrders,
    summary: {
      total_value: Math.round(totalValue * 100) / 100,
      average_order_value: Math.round(avgOrderValue * 100) / 100,
      avg_days_between_orders: avgDaysBetweenOrders,
    },
    orders: orders.map((o) => ({
      document_no: o.DocumentNo,
      order_date: o.OrderDate,
      posting_date: o.PostingDate,
      amount: o.Amount,
      status: o.Status,
      salesperson_code: o.SalespersonCode,
    })),
  };
}
