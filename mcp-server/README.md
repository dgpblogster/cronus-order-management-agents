# mcp-cronus

The MCP server the three specialist agents in this repository call. A small TypeScript server
that exposes eight read-only tools over a SQL Server database of CRONUS demo data, speaking MCP
over stdio or over HTTP.

Built for the DynamicsCon 2026 session "Multi-Agent Orchestration: Building an AI workforce with
Copilot Studio."

## Read this before you run it

**This server implements no authentication.** There is no API key check, no bearer token, no
Entra ID. Any client that can reach `/mcp` can call all eight tools. The custom connector in
this repository matches: its `connectionparameters.json` is `{}` and its OpenAPI definition
declares `securityDefinitions: {}` and `security: []`, so Copilot Studio sends no credential
either.

That is worth sitting with, because it is the point the
[blog post](https://www.theworkbench.blog) this repository accompanies ends on. The three agents
have genuinely disjoint tool grants, declared with `UseSpecificTools` and enforced by Copilot
Studio. The server underneath enforces nothing. The Finance agent cannot call `get_inventory`,
but anyone holding the endpoint URL can. **The grant is real and it is client-side.**

For a demo on a laptop behind a tunnel you close afterwards, that is a reasonable trade. As a
pattern to copy into anything that matters, it is not: put the hard control where the
orchestrator cannot route around it, which means on the server or in the identity the call runs
under. CORS is also wide open (`origin: "*"`), which the Copilot Studio connector needs and
which you should narrow anywhere else.

## The eight tools

| Tool | Source | Granted to |
|---|---|---|
| `search_customer` | [src/tools/customers.ts](src/tools/customers.ts) | Sales |
| `get_customer_details` | [src/tools/customers.ts](src/tools/customers.ts) | Sales |
| `get_customer_pricing` | [src/tools/pricing.ts](src/tools/pricing.ts) | Sales |
| `get_order_history` | [src/tools/orders.ts](src/tools/orders.ts) | Sales |
| `get_credit_profile` | [src/tools/credit.ts](src/tools/credit.ts) | Finance |
| `calculate_credit_exposure` | [src/tools/credit.ts](src/tools/credit.ts) | Finance |
| `get_inventory` | [src/tools/inventory.ts](src/tools/inventory.ts) | Inventory |
| `check_availability` | [src/tools/inventory.ts](src/tools/inventory.ts) | Inventory |

All eight are read-only `SELECT`s. Every user value goes through `executeQuery(sql, params)` in
[src/db/connection.ts](src/db/connection.ts), which binds each parameter with
`request.input()`, so the queries are parameterized rather than concatenated.

`calculate_credit_exposure` is the one tool that does more than fetch: it computes projected
utilization against the customer's credit limit and returns a recommendation.

## The database it expects

Not a Business Central database. A purpose-built demo schema of six tables:

```text
Customers        CreditProfiles     Products
Inventory        Pricing            OrderHistory
```

[`../sql/cronus-demo.sql`](../sql/cronus-demo.sql) recreates all six tables and their 59 rows
of fictional data, extracted from the live demo database rather than reconstructed. See
[sql/README.md](../sql/README.md).

[check-schema.cjs](check-schema.cjs) prints the columns of all six tables from a live database
if you want to compare your own against what the code reads.

## Running it

```bash
sqlcmd -S localhost -d Cronus -i ../sql/cronus-demo.sql   # create the database first
npm install
cp .env.sample .env     # then fill in DB_SERVER, DB_USER, DB_PASSWORD
npm run build
```

Two transports:

```bash
npm start           # stdio, for a local MCP client
npm run start:http  # HTTP on MCP_HTTP_PORT, for Copilot Studio
```

The HTTP transport serves exactly two routes: `GET /health`, which returns
`{"status":"ok","server":"mcp-cronus"}`, and `ALL /mcp`, which handles MCP requests statelessly.

`npm run dev` compiles and starts in one step.

Every key in `.env.sample` is one the code reads, and there are no others. If you find a stale
`SQL_*` or `MCP_API_KEY` key in an older copy of this project, it is from a draft that the code
never matched.

## Exposing it to Copilot Studio

**Copilot Studio cannot reach `localhost`.** Its Add MCP server dialog takes "the HTTPS endpoint
of the MCP server," and Copilot Studio is a cloud service, so running this server for an agent
means tunnelling it or hosting it. The agents here were pointed at a VS Code dev tunnel, which
is why their connector definition carries a `devtunnels.ms` hostname in the original export; in
the published copy it reads `YOUR-MCP-HOST.example.com`, so substitute your own before importing.

If you tunnel, do not make the tunnel anonymous. An anonymous tunnel in front of a server with
no authentication is an open endpoint. Prefer one that requires sign-in, and close it afterwards.

[DEPLOYMENT.md](DEPLOYMENT.md) covers the three routes in full: dev tunnel, hosting it on Azure
properly, and the question of whether this should be a custom server at all. The short version
of that last one: the Azure MCP Server's `sql` tools are control-plane and cannot read your rows,
while **SQL MCP Server** (Data API builder) can and would move the per-agent grant from Copilot
Studio to the server, where it belongs. It is a rewrite rather than a migration.

## License

MIT, same as the rest of this repository.
