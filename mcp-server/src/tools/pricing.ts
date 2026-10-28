/**
 * Pricing-related tool handlers
 */

import { executeQuery } from "../db/connection.js";

interface PricingRecord {
  CustomerNo: string;
  ItemNo: string;
  UnitPrice: number;
  MinimumQuantity: number;
  StartingDate: Date;
  EndingDate: Date | null;
}

interface ProductRecord {
  ItemNo: string;
  Description: string;
  UnitPrice: number;
}

export async function handleGetCustomerPricing(
  customerNo: string,
  itemNo: string
): Promise<unknown> {
  // First check for negotiated/customer-specific pricing (active today)
  const pricing = await executeQuery<PricingRecord>(
    `SELECT CustomerNo, ItemNo, UnitPrice, MinimumQuantity
     FROM Pricing
     WHERE CustomerNo = @customerNo AND ItemNo = @itemNo
       AND StartingDate <= GETDATE()
       AND (EndingDate IS NULL OR EndingDate >= GETDATE())`,
    { customerNo, itemNo }
  );

  if (pricing.length > 0) {
    return {
      success: true,
      pricing_type: "negotiated",
      customer_no: customerNo,
      item_no: itemNo,
      unit_price: pricing[0].UnitPrice,
      minimum_quantity: pricing[0].MinimumQuantity,
    };
  }

  // Fall back to list price from Products table
  const product = await executeQuery<ProductRecord>(
    `SELECT ItemNo, Description, UnitPrice
     FROM Products
     WHERE ItemNo = @itemNo`,
    { itemNo }
  );

  if (product.length === 0) {
    return {
      success: false,
      error: `Product ${itemNo} not found`,
    };
  }

  return {
    success: true,
    pricing_type: "list",
    customer_no: customerNo,
    item_no: itemNo,
    unit_price: product[0].UnitPrice,
    description: product[0].Description,
  };
}
