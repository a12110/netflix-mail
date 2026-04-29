# Netflix Mail Access Code Worker

## Goal

Build a Cloudflare Workers application that receives routed emails, stores access/login code emails in D1, and exposes an admin dashboard plus restricted visitor links.

## Delivery Boundary

- TypeScript Worker with HTTP and Email Routing handlers.
- D1 schema and migrations for admins, emails, content chunks, rules, share links, and audit logs.
- Admin login, email browsing, rule management, and share-link creation.
- Visitor page and API scoped by share token and dynamic 30-minute window.
- Unit tests for parsing helpers, rule matching, content chunking, and token behavior.

## Constraints

- Store no attachment binary data.
- Store large body/header payloads in D1 chunks.
- Store share tokens as hashes only.
- Use prepared D1 statements.
- Keep MVP deployment manual for Cloudflare Email Routing binding.
