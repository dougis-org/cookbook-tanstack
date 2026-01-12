---
    description: Configuration for AI behavior when interacting with Codacy's MCP Server
    applyTo: '**'
---
---

# Codacy Rules

Configuration for AI behavior when interacting with Codacy's MCP Server

## using any tool that accepts the arguments: `provider`, `organization`, or `repository`

- ALWAYS use:
- provider: gh
- organization: dougis-org
- repository: cookbook-tanstack
- Avoid calling `git remote -v` unless really necessary

