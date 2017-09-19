apollo-codegen generate **/*.graphql --schema node_modules/@atomist/automation-client/internal/graph/schema.cortex.json \
  --target typescript  --add-typename --output src/schema.ts
