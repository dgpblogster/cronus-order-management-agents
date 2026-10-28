/**
 * Credit profile tool handlers
 */

import { executeQuery } from "../db/connection.js";

interface CreditRecord {
  CustomerNo: string;
  CreditLimit: number;
  BalanceLCY: number;
  DaysPastDue: number;
  ReviewThresholdPct: number;
  PaymentHistoryRating: string;
  OnHold: boolean;
}

export async function handleGetCreditProfile(customerNo: string): Promise<unknown> {
  const results = await executeQuery<CreditRecord>(
    `SELECT CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, ReviewThresholdPct, PaymentHistoryRating, OnHold
     FROM CreditProfiles
     WHERE CustomerNo = @customerNo`,
    { customerNo }
  );

  if (results.length === 0) {
    return {
      success: false,
      error: `Credit profile not found for customer ${customerNo}`,
    };
  }

  const credit = results[0];
  const availableCredit = credit.CreditLimit - credit.BalanceLCY;
  const utilizationPercent =
    credit.CreditLimit > 0
      ? Math.round((credit.BalanceLCY / credit.CreditLimit) * 10000) / 100
      : 0;
  // Auto-approval threshold is calculated as a percentage of credit limit
  const autoApprovalThreshold = credit.CreditLimit * (credit.ReviewThresholdPct / 100);

  let riskLevel: string;
  if (credit.OnHold || credit.DaysPastDue > 60 || utilizationPercent > 90) {
    riskLevel = "high";
  } else if (credit.DaysPastDue > 30 || utilizationPercent > 75) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  return {
    success: true,
    customer_no: customerNo,
    credit_limit: credit.CreditLimit,
    outstanding_balance: credit.BalanceLCY,
    available_credit: availableCredit,
    utilization_percent: utilizationPercent,
    days_past_due: credit.DaysPastDue,
    auto_approval_threshold: autoApprovalThreshold,
    payment_history_rating: credit.PaymentHistoryRating,
    on_hold: credit.OnHold,
    risk_level: riskLevel,
  };
}

export async function handleCalculateCreditExposure(
  customerNo: string,
  orderAmount: number
): Promise<unknown> {
  const results = await executeQuery<CreditRecord>(
    `SELECT CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, ReviewThresholdPct, PaymentHistoryRating, OnHold
     FROM CreditProfiles
     WHERE CustomerNo = @customerNo`,
    { customerNo }
  );

  if (results.length === 0) {
    return {
      success: false,
      error: `Credit profile not found for customer ${customerNo}`,
    };
  }

  const credit = results[0];
  const currentExposure = credit.BalanceLCY;
  const projectedExposure = currentExposure + orderAmount;
  const availableCredit = credit.CreditLimit - currentExposure;
  const projectedUtilization =
    credit.CreditLimit > 0
      ? Math.round((projectedExposure / credit.CreditLimit) * 10000) / 100
      : 100;
  const currentUtilization =
    credit.CreditLimit > 0
      ? Math.round((currentExposure / credit.CreditLimit) * 10000) / 100
      : 0;
  const autoApprovalThreshold = credit.CreditLimit * (credit.ReviewThresholdPct / 100);

  const withinLimit = projectedExposure <= credit.CreditLimit;
  const withinAutoApproval = orderAmount <= autoApprovalThreshold;
  const hasOverdueBalance = credit.DaysPastDue > 0;

  let recommendation: string;
  let requiresCfoReview = false;

  if (!withinLimit) {
    recommendation = `Order exceeds credit limit by ${Math.round((projectedExposure - credit.CreditLimit) * 100) / 100}. CFO review required.`;
    requiresCfoReview = true;
  } else if (hasOverdueBalance && credit.DaysPastDue > 30) {
    recommendation = `Customer has ${credit.DaysPastDue} days past due balance. CFO review recommended.`;
    requiresCfoReview = true;
  } else if (!withinAutoApproval) {
    recommendation = `Order amount exceeds auto-approval threshold of ${autoApprovalThreshold}. CFO review required`;
    requiresCfoReview = true;
  } else if (projectedUtilization > 80) {
    recommendation = "Order is within limits but brings utilization above 80%. Monitor closely.";
  } else {
    recommendation = "Order is within all limits. Auto-approval recommended.";
  }

  return {
    success: true,
    customer_no: customerNo,
    order_amount: orderAmount,
    current_exposure: currentExposure,
    projected_exposure: Math.round(projectedExposure * 100) / 100,
    credit_limit: credit.CreditLimit,
    available_credit: Math.round(availableCredit * 100) / 100,
    current_utilization_percent: currentUtilization,
    projected_utilization_percent: projectedUtilization,
    within_credit_limit: withinLimit,
    within_auto_approval: withinAutoApproval,
    requires_cfo_review: requiresCfoReview,
    days_past_due: credit.DaysPastDue,
    recommendation,
  };
}
