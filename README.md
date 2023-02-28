# ☁️ CDS (Cloud Development Suite)

A bunch of reusable CDK constructs and stacks, still **under development**.

## What still needs to be tackled?

- Move all my developer-side `hcl` stuff to `cdktf`.
- Implement a Grantor component to handle proper least privilege RBAC policies between resources (via a `cds-grantor` package) and eventually implement partial multi-cloud support.
- Write a `cdktf` + `cds` starter template.
- Write fully-synthetized specs (`tflint` the output?).
- Look for an end-to-end test suite solution that integrates well with `cdktf` and TypeScript.
- Documentation, documentation, documentation
