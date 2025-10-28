# Integrated Architecture Strategy

## Systems Philosophy
- The platform treats the LIMS as the single source of truth for manufacturing intelligence and operational state.
- The Principal Engineer operates as administrator of the LIMS and encodes process knowledge directly into rules, tolerances, and catalog updates.
- Every service interaction ultimately reconciles with the LIMS so that business logic, manufacturing feasibility, and catalog availability remain centralized.

## Core Brain: LIMS Ownership and Governance
- LIMS stores deterministic manufacturing rules (e.g., lens material, prescription, and machine program mappings) and exposes them via API.
- Principal Engineer responsibilities include authoring and maintaining rules, auditing production signals, and triggering innovation cycles.
- A dedicated engineer dashboard consumes telemetry from LIMS events and ECP Portal analytics to surface failure rates, ordering trends, and R&D opportunities.

## Digital Interface: SaaS Microservice Architecture
- Deploy microservices as containerized workloads on Kubernetes (AWS EKS recommended) behind an API Gateway; embrace infrastructure-as-code for repeatability.
- Prefer managed identity (AWS Cognito/Auth0), managed databases (RDS Postgres, DynamoDB), and Stripe Connect for payment orchestration.
- Primary services:
  - **Auth Service**: external identity provider plus thin adapter for role claims and tenant scoping.
  - **Practice Service**: ECP practice metadata, staff roster, and supplier registry persisted in PostgreSQL.
  - **Order Service**: core dispensing workflow that validates every configuration against the LIMS API before commit and hands off finalized jobs to the lab queue.
  - **POS Service**: Stripe Connect integration for order and OTC tills with DynamoDB-backed ledger of transactions and payouts.
  - **Billing Service**: consumes Stripe webhooks to produce PDFs and email notifications; leverages shared PDF generation utilities.
  - **Supplier Service**: assembles outbound POs for frames and consumables using practice supplier data and submitted orders.
- The React SPA communicates solely with the API Gateway, remaining stateless while services enforce business rules and persistence.

## Synapse: Bi-Directional LIMS ↔ Portal Flows
- **Flow 1 – Order Submission**: Order Service validates selections with LIMS in real time; upon submission it emits a `CreateJob` payload to LIMS, records the returned `job_id`, and transitions state to "Order Sent to Lab".
- **Flow 2 – Status Updates**: LIMS issues webhooks (e.g., `{ job_id, new_status }`) on state changes; Order Service consumes these callbacks, updates downstream projections, and pushes live status to the SPA.
- **Flow 3 – Catalog Innovation**: When the Principal Engineer publishes new rules in LIMS, it notifies the Order Service to activate catalog entries instantly, enabling zero-lag distribution of innovations to ECPs.

## Implementation Implications
- Introduce a shared LIMS client package that encapsulates API schemas, retry semantics, and contract tests so every service interacts with the source of truth uniformly.
- Model rule deployments and catalog revisions as versioned events to support auditing, rollback, and dashboard analytics.
- Keep services independently deployable; enforce clear boundaries through typed API contracts, shared schema definitions, and consumer-driven tests.

## Phased Rollout Roadmap
1. **Phase 0 – Foundation (Months 0-3)**: Hire Principal Engineer, select/stand up LIMS, build Auth Service and initial LIMS API integration (Order Service Flow 1 skeleton).
2. **Phase 1 – MVP Internal (Months 4-6)**: Deliver Order Service + basic SPA enabling internal beta ECP to submit jobs to LIMS; status updates managed manually.
3. **Phase 2 – MVP ECP (Months 7-12)**: Automate Flow 2 status webhooks, launch POS Service (Order Till) and Billing Service to close revenue loop for pilot ECPs.
4. **Phase 3 – All-in-One Platform (Months 12-18)**: Ship Practice Service, Supplier Service, and OTC Till; transform solution into a full practice management platform.
5. **Phase 4 – Innovation Loop (Ongoing)**: Operationalize Flow 3, analytics dashboards, and continuous R&D feedback mechanisms driven by live production data.

## Next Steps
- Align service code scaffolding and repository structure with the service boundaries listed above.
- Draft infrastructure definitions (Terraform/Terragrunt) for core AWS resources and deployment pipelines.
- Plan Principal Engineer dashboard requirements using telemetry exposed by LIMS and existing analytics utilities.
