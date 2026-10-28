/**
 * Customer-related tool handlers
 */

import { executeQuery } from "../db/connection.js";

interface CustomerRecord {
  CustomerNo: string;
  Name: string;
  Address?: string;
  City?: string;
  State?: string;
  PostalCode?: string;
  Country?: string;
  PhoneNo?: string;
  Email?: string;
  SalespersonCode?: string;
  PaymentTermsCode?: string;
  IsActive?: boolean;
}

export async function handleSearchCustomer(query: string): Promise<unknown> {
  const results = await executeQuery<CustomerRecord>(
    `SELECT TOP 25 CustomerNo, Name, City, State
     FROM Customers
     WHERE Name LIKE @query
     ORDER BY Name`,
    { query: `%${query}%` }
  );

  return {
    success: true,
    count: results.length,
    customers: results.map((c) => ({
      customer_no: c.CustomerNo,
      name: c.Name,
      city: c.City,
      state: c.State,
    })),
  };
}

export async function handleGetCustomerDetails(customerNo: string): Promise<unknown> {
  const results = await executeQuery<CustomerRecord>(
    `SELECT CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, SalespersonCode, PaymentTermsCode, IsActive
     FROM Customers
     WHERE CustomerNo = @customerNo`,
    { customerNo }
  );

  if (results.length === 0) {
    return {
      success: false,
      error: `Customer ${customerNo} not found`,
    };
  }

  const c = results[0];
  return {
    success: true,
    customer: {
      customer_no: c.CustomerNo,
      name: c.Name,
      address: c.Address,
      city: c.City,
      state: c.State,
      postal_code: c.PostalCode,
      country: c.Country,
      phone: c.PhoneNo,
      email: c.Email,
      salesperson_code: c.SalespersonCode,
      payment_terms: c.PaymentTermsCode,
      is_active: c.IsActive,
    },
  };
}
