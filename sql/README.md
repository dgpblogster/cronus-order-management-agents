# The demo database

[`cronus-demo.sql`](cronus-demo.sql) recreates the database the
[MCP server](../mcp-server) reads: six tables, schema and all 59 rows of fictional data.

It is **not** a Business Central database. It is a small purpose-built schema holding
fictional CRONUS USA, Inc. data, which is what let the demo answer order-qualification
questions without a BC environment in the room.

## Running it

```bash
sqlcmd -S localhost -d Cronus -i cronus-demo.sql
```

Against any empty database. The script drops each of the six tables first, in reverse creation
order, so it is safe to re-run and will destroy anything already in those table names. Point it
at a database you are willing to lose.

Then set `DB_DATABASE` in the server's `.env` to whatever you called it.

## What is in it

| Table | Rows | Read by |
|---|---|---|
| `Customers` | 6 | `search_customer`, `get_customer_details` |
| `Products` | 6 | `get_customer_pricing`, `check_availability` |
| `CreditProfiles` | 6 | `get_credit_profile`, `calculate_credit_exposure` |
| `Pricing` | 5 | `get_customer_pricing` |
| `Inventory` | 10 | `get_inventory`, `check_availability` |
| `OrderHistory` | 26 | `get_order_history` |

The customers are Microsoft's fictional demo companies: Adatum Corporation, Trey Research and
company. Two of them share a name stem on purpose, `Adatum Corporation` and
`Adatum Holdings, Inc.`, which is what makes the orchestrator's first step, "if Sales returns
ambiguity, ask Maria to clarify before proceeding", do something visible in a demo.

## How it was produced, and how it was checked

Extracted from the live demo database with `INFORMATION_SCHEMA.COLUMNS`,
`sys.identity_columns` and `sys.indexes`, so the column types, nullability, defaults, identity
columns and primary keys are the real ones rather than a reconstruction.

Verified on **2026-10-28** by running the script into a throwaway database, confirming all six
row counts, and running one of the server's own queries against the result.
