# Getting this server where Copilot Studio can reach it

Verified against Microsoft Learn on **2026-10-28**. Nothing below is implemented in this
repository; it is the set of routes and their trade-offs.

## The hard requirement

Copilot Studio's **Add MCP server** dialog asks for a **Server URL**, described in the
documentation as "the HTTPS endpoint of the MCP server," and its prerequisites call for "the URL
of an MCP server that's reachable from Copilot Studio." Copilot Studio is a cloud service. A
server on `localhost:8080` is not reachable from it.

So running this server for a Copilot Studio agent means one of two things: tunnel it, or host it.

## Route 1: a dev tunnel

What the demo in this repository did. A VS Code dev tunnel publishes `localhost:8080` at an
HTTPS URL, and that URL goes in the Server URL field. Fine for a conference demo, a rehearsal,
or a laptop.

Two things to get right:

**Do not create the tunnel anonymous.** An anonymous tunnel in front of a server with no
authentication is an open endpoint: anyone with the URL can call all eight tools. Prefer a
tunnel that requires sign-in, and close it when you are done.

**The tunnel URL changes unless the tunnel is named and persistent**, and when it changes, every
agent pointing at it breaks until you edit the connector.

## Route 2: host it

Azure SQL Database for the data, plus somewhere to run the Node server (App Service, Container
Apps, Functions). This is the route if the agents need to work when your laptop is shut.

The work is mostly not the hosting:

- Replace the SQL login with a managed identity, so `DB_USER` and `DB_PASSWORD` stop existing
- Set `DB_ENCRYPT=true` and drop `DB_TRUST_SERVER_CERTIFICATE`
- Narrow CORS from `origin: "*"` to what actually calls it
- Give the server real authentication, and configure the matching scheme in Copilot Studio's
  **Authentication** field when you add the server. Today that field has nothing to offer,
  which is exactly why this repo's connector carries `securityDefinitions: {}` and `security: []`

## Route 3: don't write a server at all

The obvious question is whether Microsoft already ships an MCP server for SQL, so the custom
server goes away. The answer is yes, but not the one most people reach for first.

### Not the Azure MCP Server

The Azure MCP Server has a `sql` namespace, and it is a **control-plane** toolset: list SQL
servers, get database details, list firewall rules, list elastic pools, list Entra ID
administrators, create a SQL server. It manages the resource. It does not read your rows, and
nothing in it resembles `get_credit_profile`. It is not a substitute for this server.

### SQL MCP Server, which is Data API builder

[SQL MCP Server](https://learn.microsoft.com/azure/data-api-builder/mcp/overview) is the
data-plane one. It is part of Data API builder, and it exposes **seven DML tools**:
`describe_entities`, `read_records`, `create_record`, `update_record`, `delete_record`,
`execute_entity`, and `aggregate_records`. You configure entities, it serves them over REST,
GraphQL and MCP from one configuration, and it listens on `/mcp` over streamable HTTP.

**The catch, and it is the whole subject of this repository.** Those seven tools are generic.
The agents here are scoped with `UseSpecificTools` naming eight *domain* tools, which is what
makes the Finance agent unable to call `get_inventory`. Swap in a generic DML surface and the
most specific grant you can write is `read_records`, which reads every entity you exposed. The
scoping does not get weaker, it stops existing.

**And the catch has an answer that is better than where this repo is today.** Two features
matter:

- **RBAC is per entity and per field**, defining which roles may read, create, update or delete
  and which fields are included or excluded, and those rules "apply automatically to every MCP
  tool" across REST, GraphQL and MCP.
- **Stored procedures can be registered as named tools** with `"custom-tool": true`, so
  `calculate_credit_exposure` stays a named tool rather than dissolving into `read_records`.

Put those together and the grant moves from the Copilot Studio side to the server side. Today's
setup has disjoint tool lists enforced entirely by Copilot Studio in front of a server that
enforces nothing, so the separation holds for the agents and not for anyone holding the URL.
Under Data API builder, the separation would be enforced where the orchestrator cannot route
around it, which is the whole recommendation in
[ESCALATION.md](https://github.com/dgpblogster/connected-agent-access/blob/main/ESCALATION.md).

That is a rewrite, not a migration, and it is not done here. It is the honest answer to "should
this be a custom server at all."

## Sources

- [Add a Model Context Protocol (MCP) server to your agent as a tool](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/tools-add-mcp-server)
- [What is SQL MCP Server?](https://learn.microsoft.com/azure/data-api-builder/mcp/overview)
- [Azure MCP Server tools for Azure SQL Database](https://learn.microsoft.com/azure/developer/azure-mcp-server/tools/azure-sql)
