set shell := ["bash", "-euo", "pipefail", "-c"]

# Show available recipes grouped by workflow.
[group('Help')]
default:
    just --list

# List recipe groups.
[group('Help')]
groups:
    just --groups --unsorted

# Start the TanStack Start console dev server.
[group('Development')]
dev:
    pnpm --filter @vane/console dev

# Build the console app.
[group('Development')]
build:
    pnpm --filter @vane/console build

# Run every package's test suite.
[group('Quality')]
test:
    pnpm -r --if-present test

# Run every package's linter.
[group('Quality')]
lint:
    pnpm -r --if-present lint

# Check formatting across packages.
[group('Quality')]
fmt-check:
    pnpm -r --if-present fmt:check

# Format all packages.
[group('Quality')]
fmt:
    pnpm -r --if-present fmt

# Run the normal local handoff checks.
[group('Quality')]
check: fmt-check lint test

# Run console tests.
[group('Packages')]
test-console:
    pnpm --filter @vane/console test

# Run core package tests.
[group('Packages')]
test-core:
    pnpm --filter @vane/core test

# Run provider package tests.
[group('Packages')]
test-providers:
    pnpm --filter @vane/providers test

# Run destination package tests.
[group('Packages')]
test-destinations:
    pnpm --filter @vane/destinations test
