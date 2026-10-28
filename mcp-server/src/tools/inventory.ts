/**
 * Inventory tool handlers
 */

import { executeQuery } from "../db/connection.js";

interface InventoryRecord {
  ItemNo: string;
  LocationCode: string;
  QuantityOnHand: number;
  QuantityAllocated: number;
  QuantityInbound: number;
  InboundExpectedDate: Date | null;
}

interface ProductRecord {
  ItemNo: string;
  Description: string;
}

export async function handleGetInventory(itemNo: string): Promise<unknown> {
  const inventory = await executeQuery<InventoryRecord>(
    `SELECT ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate
     FROM Inventory
     WHERE ItemNo = @itemNo
     ORDER BY LocationCode`,
    { itemNo }
  );

  if (inventory.length === 0) {
    // Check if the product exists
    const product = await executeQuery<ProductRecord>(
      `SELECT ItemNo, Description FROM Products WHERE ItemNo = @itemNo`,
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
      item_no: itemNo,
      description: product[0].Description,
      total_on_hand: 0,
      total_available: 0,
      locations: [],
      message: "No inventory records found for this item",
    };
  }

  const totalOnHand = inventory.reduce((sum, i) => sum + i.QuantityOnHand, 0);
  const totalAllocated = inventory.reduce((sum, i) => sum + i.QuantityAllocated, 0);
  const totalAvailable = totalOnHand - totalAllocated;
  const totalInbound = inventory.reduce((sum, i) => sum + (i.QuantityInbound || 0), 0);

  return {
    success: true,
    item_no: itemNo,
    summary: {
      total_on_hand: totalOnHand,
      total_allocated: totalAllocated,
      total_available: totalAvailable,
      total_inbound: totalInbound,
    },
    locations: inventory.map((i) => ({
      location_code: i.LocationCode,
      on_hand: i.QuantityOnHand,
      allocated: i.QuantityAllocated,
      available: i.QuantityOnHand - i.QuantityAllocated,
      inbound_qty: i.QuantityInbound || 0,
      inbound_date: i.InboundExpectedDate,
    })),
  };
}

export async function handleCheckAvailability(
  itemNo: string,
  quantity: number,
  requiredByDate?: string
): Promise<unknown> {
  const inventory = await executeQuery<InventoryRecord>(
    `SELECT ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate
     FROM Inventory
     WHERE ItemNo = @itemNo
     ORDER BY (QuantityOnHand - QuantityAllocated) DESC`,
    { itemNo }
  );

  if (inventory.length === 0) {
    return {
      success: false,
      error: `No inventory found for item ${itemNo}`,
    };
  }

  const totalAvailable = inventory.reduce((sum, i) => sum + (i.QuantityOnHand - i.QuantityAllocated), 0);
  const canFulfillNow = totalAvailable >= quantity;

  // Build fulfillment plan from available stock
  const fulfillmentPlan: Array<{
    location_code: string;
    quantity: number;
    source: string;
  }> = [];

  let remaining = quantity;

  // First, allocate from available stock
  for (const loc of inventory) {
    if (remaining <= 0) break;
    const available = loc.QuantityOnHand - loc.QuantityAllocated;
    if (available > 0) {
      const allocate = Math.min(available, remaining);
      fulfillmentPlan.push({
        location_code: loc.LocationCode,
        quantity: allocate,
        source: "on_hand",
      });
      remaining -= allocate;
    }
  }

  // If still not enough, check inbound stock
  const requiredDate = requiredByDate ? new Date(requiredByDate) : null;
  let canFulfillWithInbound = remaining <= 0;
  let earliestInboundDate: Date | null = null;

  if (remaining > 0) {
    for (const loc of inventory) {
      if (remaining <= 0) break;
      if (loc.QuantityInbound > 0 && loc.InboundExpectedDate) {
        const inboundDate = new Date(loc.InboundExpectedDate);
        const meetsDate = !requiredDate || inboundDate <= requiredDate;

        if (meetsDate) {
          const allocate = Math.min(loc.QuantityInbound, remaining);
          fulfillmentPlan.push({
            location_code: loc.LocationCode,
            quantity: allocate,
            source: "inbound",
          });
          remaining -= allocate;
          if (!earliestInboundDate || inboundDate > earliestInboundDate) {
            earliestInboundDate = inboundDate;
          }
        }
      }
    }
    canFulfillWithInbound = remaining <= 0;
  }

  const canFulfill = canFulfillNow || canFulfillWithInbound;
  const shortfall = remaining > 0 ? remaining : 0;

  let recommendation: string;
  if (canFulfillNow) {
    recommendation = `Full quantity of ${quantity} available for immediate shipment.`;
  } else if (canFulfillWithInbound) {
    recommendation = `Full quantity can be fulfilled with split shipment. Final delivery by ${earliestInboundDate?.toISOString().split("T")[0]}.`;
  } else {
    recommendation = `Only ${quantity - shortfall} units can be fulfilled. Shortfall of ${shortfall} units.`;
  }

  return {
    success: true,
    item_no: itemNo,
    requested_quantity: quantity,
    required_by_date: requiredByDate || null,
    total_available: totalAvailable,
    can_fulfill_now: canFulfillNow,
    can_fulfill_with_inbound: canFulfillWithInbound,
    can_fulfill: canFulfill,
    shortfall: shortfall,
    fulfillment_plan: fulfillmentPlan,
    recommendation,
  };
}
