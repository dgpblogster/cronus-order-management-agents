# CRONUS order-management agents

A four-agent Microsoft Copilot Studio multi-agent setup, exported from a live environment with
`pac copilot clone`. One orchestrator delegates to three specialists; the specialists reach
business data through a single shared MCP server.

It was built for a conference demo against CRONUS USA, Inc., the standard Microsoft Dynamics
demo company, and it is published here as the worked sample behind
[Works on My Agent, the New "Works on My Computer"](https://www.theworkbench.blog) on
[The Workbench](https://www.theworkbench.blog), and as the filled-in example in
[connected-agent-access](https://github.com/dgpblogster/connected-agent-access).

The point of shipping it is not the agents. It is that the exported definitions record several
access facts the maker portal does not show you.

## The shape

```text
CRONUS Order Orchestrator            no tools of its own
  |
  +-- CRONUS Sales Specialist        -> Cronus Master MCP Server
  +-- CRONUS Finance Specialist      -> Cronus Master MCP Server
  +-- CRONUS Inventory Specialist    -> Cronus Master MCP Server
```

None of the three specialists has connected agents of its own, so the graph is one level deep.

The orchestrator helps an inside sales manager decide whether to commit to an incoming order:
call Sales for the canonical customer number and negotiated price, compute the order amount,
call Finance and Inventory in parallel, synthesize one recommendation, and default to "hold and
escalate" if any specialist fails or data is missing. Its full instruction text is in
[agents/CRONUS Order Orchestrator/agent.mcs.yml](agents/CRONUS%20Order%20Orchestrator/agent.mcs.yml).

## The access matrix

| Agent | Schema name | Connector | MCP tools granted |
|---|---|---|---|
| CRONUS Order Orchestrator | `cr83a_orderQualificationAssistant` | none | none |
| CRONUS Sales Specialist | `cr83a_cronusSalesContextAssistant` | Cronus Master MCP Server | `search_customer`, `get_customer_details`, `get_customer_pricing`, `get_order_history` |
| CRONUS Finance Specialist | `cr83a_financeCreditEvaluator` | Cronus Master MCP Server | `get_credit_profile`, `calculate_credit_exposure` |
| CRONUS Inventory Specialist | `cr83a_inventoryFulfillmentSpecialist` | Cronus Master MCP Server | `get_inventory`, `check_availability` |

Each specialist also has its own connection reference on that shared connector, named after the
agent's own schema name.

## Three things the source shows and the portal does not

### 1. The tool scoping is real

In the maker portal, all three specialists show the same single entry under Tools, named
`Cronus Master MCP Server`, which reads like identical access to the same server. The exported
action tells a different story:

```yaml
action:
  kind: InvokeExternalAgentTaskAction
  connectionReference: cr83a_financeCreditEvaluator.shared_cr83a-...
  connectionProperties:
    mode: Invoker
  operationDetails:
    kind: ModelContextProtocolMetadata
    operationId: InvokeServer
    tools:
      kind: UseSpecificTools
      tools:
        - get_credit_profile
        - calculate_credit_exposure
```

`kind: UseSpecificTools` with a **disjoint** tool list per agent, and a **separate connection
reference** per agent on the shared connector. Sales cannot call `get_credit_profile`. Finance
cannot call `get_inventory`. The division of labour between the three specialists is enforced
at the tool grant, not merely described in their instructions.

That is the inverse of what the portal's Tools pane implies, and it is the reason this repo
exists: the portal shows you the connector, the source shows you the grant.

### 2. Every delegation hands over the whole conversation

Each connected-agent action on the orchestrator carries:

```yaml
action:
  kind: InvokeConnectedAgentTaskAction
  botSchemaName: cr83a_cronusSalesContextAssistant
  historyType:
    kind: ConversationHistory
```

`historyType: ConversationHistory` on all three. Whatever is in the conversation when the
orchestrator delegates crosses into an agent with its own access list. For a flow about
customer credit, that means three agents see the credit discussion. Worth knowing before the
conversation contains anything you would not put in all three places.

### 3. The connections run as the invoker

`connectionProperties: mode: Invoker` on all three MCP actions, so the call runs under the
signed-in user's connection rather than a shared or service-principal identity. That is the
documented reason an agent can work for its maker and fail for everyone else, and it is visible
here without having to test it.

## What else the definitions record

Identical across all four agents:

| Setting | Value |
|---|---|
| `accessControlPolicy` | `GroupMembership` |
| `authenticationMode` | `Integrated` |
| `isAgentConnectable` | `true` |
| `GenerativeActionsEnabled` | `true` |
| `useModelKnowledge` | `true` |
| `contentModeration` | `Low` |
| `optInUseLatestModels` | `false` |
| `webBrowsing` | `false` |
| `recognizer` | `GenerativeAIRecognizer` |

Model hints differ: `opus4-1` on Sales, `Sonnet46` on the other three.

Two notes on reading that table honestly. `useModelKnowledge: true` is recorded in the exported
settings; this repo does not claim which portal toggle it corresponds to, and the agent-level
knowledge behavior worth reading is
[Allow ungrounded responses](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio#allow-ungrounded-responses).
And `contentModeration: Low` with permissive knowledge settings is ordinary for a demo; these
are listed because a reviewer of a production setup would want them in the matrix, not because
anything here is misconfigured.

## Harness

This topology runs on the **standard harness**. Microsoft's connected-agents how-to is written
for the GitHub Copilot harness and names that harness in its prerequisites for both parent and
child, so harness-specific claims are worth checking against the experience you are actually in.

## The MCP server

It is in [mcp-server/](mcp-server), so this repository is the whole demo rather than half of it:
a TypeScript server exposing eight read-only tools over a SQL Server database of CRONUS demo
data, speaking MCP over stdio or HTTP.

Read [its README](mcp-server/README.md) before running it. The short version, and the finding
the three tool grants above are only half of: **the server implements no authentication.** No
API key, no token. The connector agrees, declaring `securityDefinitions: {}` and `security: []`
and sending no credential. So the disjoint grants are real and they are enforced entirely by
Copilot Studio. Finance cannot call `get_inventory`; anyone holding the endpoint URL can.

The grant is client-side. For a laptop demo behind a tunnel you close afterwards that is a fair
trade, and as a pattern to copy it is not.

## The database

[sql/cronus-demo.sql](sql/cronus-demo.sql) recreates what the server reads: six tables and all
59 rows of fictional CRONUS data, extracted from the live demo database with
`INFORMATION_SCHEMA` and `sys` rather than reconstructed by hand, and verified by running it
into a throwaway database and re-running one of the server's own queries against the result.

```bash
sqlcmd -S localhost -d Cronus -i sql/cronus-demo.sql
```

Not a Business Central database. A small purpose-built schema, which is what let the demo answer
order-qualification questions without a BC environment in the room.

## Pointing it at your own host

The agents were built against that server running on the author's machine through a dev tunnel.
The hostname has been replaced in this export with `YOUR-MCP-HOST.example.com`, in:

```text
agents/CRONUS <name> Specialist/connectors/cr83a_.../openapidefinition.json
```

Substitute your own host before importing. The server is expected to speak MCP at `/mcp` and to
publish these eight read-only tools over CRONUS data:

| Tool | Used by |
|---|---|
| `search_customer` | Sales |
| `get_customer_details` | Sales |
| `get_customer_pricing` | Sales |
| `get_order_history` | Sales |
| `get_credit_profile` | Finance |
| `calculate_credit_exposure` | Finance |
| `get_inventory` | Inventory |
| `check_availability` | Inventory |

## What is and is not in this export

**Included:** the agent definitions, instructions, settings, topics, connected-agent
declarations, connection references, and the custom connector definition, for all four agents,
plus the MCP server source in [mcp-server/](mcp-server) and its database in [sql/](sql). The
whole demo, in other words.

**Excluded on purpose:** the `.mcs/` local sync-state folders that `pac copilot clone` writes
alongside each agent. They carry environment and organization identifiers, connection instance
IDs, and credential material, none of which belongs in a public repository. If you clone your
own agents and intend to publish them, exclude `.mcs/` and check what is left. The server's
`.env` is excluded for the same reason, and `.env.sample` lists every key the code reads and
nothing else.

**Not exercised:** the sharing behavior. Nobody signed in as a second, non-owner user and walked
the path, which is the one test that actually settles whether a connected-agent setup is shared
correctly. Everything above is read out of the definitions, not out of a run.

## How this was exported

```bash
pac auth create --environment <your environment id>
pac copilot list
pac copilot clone --bot-schema-name cr83a_orderQualificationAssistant --out .
```

Repeat per agent. One thing that is worth knowing does not work: adding bots to a solution with
`pac solution add-solution-component --componentType 371` fails with `The entity with a name =
'msdyn_Connector' with namemapping = 'Platform' was not found in the MetadataCache`, with and
without `--AddRequiredComponents`. `pac copilot clone` is the path that works, and it produces
better artifacts for a repository anyway.

## Contributing

This repository is a publishing surface for the blog rather than a community project, so it does
not accept pull requests. If something here no longer matches what Copilot Studio exports, the
comments on the related blog post are the right place, and that is where corrections come from.

## License

MIT. See [LICENSE](LICENSE).
