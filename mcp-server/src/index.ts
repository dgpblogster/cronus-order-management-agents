/**
 * MCP Cronus Server
 *
 * This is the main entry point for the Model Context Protocol server.
 * It exposes Cronus Business Central data from SQL Server as queryable tools
 * for Microsoft Copilot Studio agents.
 *
 * Supports HTTP transport via Streamable HTTP for remote access via dev tunnels.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

// Load environment variables
dotenv.config();

// Import tool handlers
import { handleSearchCustomer, handleGetCustomerDetails } from "./tools/customers.js";
import { handleGetCustomerPricing } from "./tools/pricing.js";
import { handleGetOrderHistory } from "./tools/orders.js";
import { handleGetCreditProfile, handleCalculateCreditExposure } from "./tools/credit.js";
import { handleGetInventory, handleCheckAvailability } from "./tools/inventory.js";

// Import database utilities
import { closePool } from "./db/connection.js";

// =============================================================================
// Tool Definitions
// =============================================================================

const TOOLS: Tool[] = [
  {
    name: "search_customer",
    description:
      "Search for customers by name or partial name. Returns up to 25 matches. Use this when a customer is mentioned by name to disambiguate which exact record is meant.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to match against customer names (2-100 characters)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_customer_details",
    description: "Get the full customer card for a specific customer number.",
    inputSchema: {
      type: "object",
      properties: {
        customer_no: {
          type: "string",
          description: "Customer number (1-20 alphanumeric characters)",
        },
      },
      required: ["customer_no"],
    },
  },
  {
    name: "get_customer_pricing",
    description:
      "Get the negotiated unit price for a specific customer and item. Falls back to the product list price if no customer-specific pricing exists.",
    inputSchema: {
      type: "object",
      properties: {
        customer_no: {
          type: "string",
          description: "Customer number",
        },
        item_no: {
          type: "string",
          description: "Item/product number",
        },
      },
      required: ["customer_no", "item_no"],
    },
  },
  {
    name: "get_order_history",
    description:
      "Get recent orders for a customer, most recent first. Used to characterize purchasing patterns and trends.",
    inputSchema: {
      type: "object",
      properties: {
        customer_no: {
          type: "string",
          description: "Customer number",
        },
        limit: {
          type: "number",
          description: "Maximum number of orders to return (default 10, max 50)",
        },
      },
      required: ["customer_no"],
    },
  },
  {
    name: "get_credit_profile",
    description:
      "Get the current credit profile for a customer, including limit, outstanding balance, days past due, and current utilization percentage.",
    inputSchema: {
      type: "object",
      properties: {
        customer_no: {
          type: "string",
          description: "Customer number",
        },
      },
      required: ["customer_no"],
    },
  },
  {
    name: "calculate_credit_exposure",
    description:
      "Given a customer and a proposed new order amount, calculate the projected credit exposure and recommend whether the order is within automatic approval or requires CFO review based on the customer's threshold.",
    inputSchema: {
      type: "object",
      properties: {
        customer_no: {
          type: "string",
          description: "Customer number",
        },
        order_amount: {
          type: "number",
          description: "Proposed order amount (must be positive)",
        },
      },
      required: ["customer_no", "order_amount"],
    },
  },
  {
    name: "get_inventory",
    description:
      "Get inventory levels for a specific item across all warehouse locations, including on-hand quantities, allocated quantities, available quantities, and any inbound stock with expected dates.",
    inputSchema: {
      type: "object",
      properties: {
        item_no: {
          type: "string",
          description: "Item/product number",
        },
      },
      required: ["item_no"],
    },
  },
  {
    name: "check_availability",
    description:
      "Given an item, a requested quantity, and an optional required-by date, determine whether the request can be fulfilled and produce a fulfillment plan. If on-hand stock is insufficient, considers inbound stock that arrives by the required date and recommends a split shipment.",
    inputSchema: {
      type: "object",
      properties: {
        item_no: {
          type: "string",
          description: "Item/product number",
        },
        quantity: {
          type: "number",
          description: "Requested quantity (positive integer)",
        },
        required_by_date: {
          type: "string",
          description: "Optional required-by date in ISO format (YYYY-MM-DD)",
        },
      },
      required: ["item_no", "quantity"],
    },
  },
];

// =============================================================================
// Parameter Validation Schemas
// =============================================================================

const SearchCustomerSchema = z.object({
  query: z.string().min(2).max(100),
});

const CustomerNoSchema = z.object({
  customer_no: z.string().min(1).max(20),
});

const CustomerPricingSchema = z.object({
  customer_no: z.string().min(1).max(20),
  item_no: z.string().min(1).max(50),
});

const OrderHistorySchema = z.object({
  customer_no: z.string().min(1).max(20),
  limit: z.number().int().min(1).max(50).default(10),
});

const CreditExposureSchema = z.object({
  customer_no: z.string().min(1).max(20),
  order_amount: z.number().positive(),
});

const ItemNoSchema = z.object({
  item_no: z.string().min(1).max(50),
});

const CheckAvailabilitySchema = z.object({
  item_no: z.string().min(1).max(50),
  quantity: z.number().int().positive(),
  required_by_date: z.string().optional(),
});

// =============================================================================
// Server Setup
// =============================================================================

function createServer(): Server {
  const serverName = process.env.MCP_SERVER_NAME || "mcp-cronus";
  const serverVersion = process.env.MCP_SERVER_VERSION || "1.0.0";

  const server = new Server(
    {
      name: serverName,
      version: serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case "search_customer": {
          const params = SearchCustomerSchema.parse(args);
          result = await handleSearchCustomer(params.query);
          break;
        }

        case "get_customer_details": {
          const params = CustomerNoSchema.parse(args);
          result = await handleGetCustomerDetails(params.customer_no);
          break;
        }

        case "get_customer_pricing": {
          const params = CustomerPricingSchema.parse(args);
          result = await handleGetCustomerPricing(params.customer_no, params.item_no);
          break;
        }

        case "get_order_history": {
          const params = OrderHistorySchema.parse(args);
          result = await handleGetOrderHistory(params.customer_no, params.limit);
          break;
        }

        case "get_credit_profile": {
          const params = CustomerNoSchema.parse(args);
          result = await handleGetCreditProfile(params.customer_no);
          break;
        }

        case "calculate_credit_exposure": {
          const params = CreditExposureSchema.parse(args);
          result = await handleCalculateCreditExposure(params.customer_no, params.order_amount);
          break;
        }

        case "get_inventory": {
          const params = ItemNoSchema.parse(args);
          result = await handleGetInventory(params.item_no);
          break;
        }

        case "check_availability": {
          const params = CheckAvailabilitySchema.parse(args);
          result = await handleCheckAvailability(
            params.item_no,
            params.quantity,
            params.required_by_date
          );
          break;
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
              },
            ],
          };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: errorMessage }),
          },
        ],
      };
    }
  });

  return server;
}

// =============================================================================
// HTTP Server
// =============================================================================

async function runHttpServer(): Promise<void> {
  const port = parseInt(process.env.MCP_HTTP_PORT || "8080", 10);

  console.error("[MCP] Starting MCP Cronus Server (HTTP mode)...");
  console.error(`[MCP] Server: ${process.env.MCP_SERVER_NAME || "mcp-cronus"}`);
  console.error(`[MCP] Version: ${process.env.MCP_SERVER_VERSION || "1.0.0"}`);
  console.error(`[MCP] Port: ${port}`);

  const app = express();

  // Enable CORS for all origins (required for Copilot Studio)
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept", "Mcp-Session-Id"],
      exposedHeaders: ["Mcp-Session-Id"],
    })
  );

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "mcp-cronus" });
  });

  // Handle all MCP requests on /mcp endpoint (stateless mode for Copilot Studio)
  app.all("/mcp", async (req: Request, res: Response) => {
    console.error(`[MCP] ${req.method} /mcp received`);

    // Create a stateless transport for each request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    // Connect a fresh MCP server to this transport
    const server = createServer();
    await server.connect(transport);

    // Let the transport handle the request
    try {
      await transport.handleRequest(req, res, req.body);
      console.error(`[MCP] Request handled successfully`);
    } catch (error) {
      console.error(`[MCP] Error handling request:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Start HTTP server
  const httpServer = app.listen(port, () => {
    console.error(`[MCP] HTTP server listening on http://localhost:${port}`);
    console.error(`[MCP] MCP endpoint: http://localhost:${port}/mcp`);
    console.error(`[MCP] Health check: http://localhost:${port}/health`);
  });

  return new Promise((resolve) => {
    httpServer.on("close", resolve);
  });
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<void> {
  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.error("[MCP] Shutting down...");
    await closePool();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.error("[MCP] Shutting down...");
    await closePool();
    process.exit(0);
  });

  await runHttpServer();
}

// Run the server
main().catch((error) => {
  console.error("[MCP] Fatal error:", error);
  process.exit(1);
});
