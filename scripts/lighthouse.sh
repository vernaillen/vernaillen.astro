#!/usr/bin/env bash
set -euo pipefail

# Lighthouse baseline for a deployed build. Runs serially: parallel audits
# compete for CPU and invalidate comparisons. Each report includes HTML, JSON,
# a Chrome trace and a DevTools network log (--save-assets).
#
#   scripts/lighthouse.sh [origin] [output-dir]
#   scripts/lighthouse.sh https://vernaillen.dev .lighthouse/2026-09-17
audit_origin="${1:-https://vernaillen.dev}"
audit_output="${2:-.lighthouse/$(date +%Y-%m-%d)}"
mkdir -p "$audit_output"

run_audit() {
  local label="$1" route="$2"
  shift 2
  printf 'Auditing %s%s (%s)\n' "$audit_origin" "$route" "$label"
  pnpm dlx lighthouse@13.4.1 \
    "${audit_origin%/}${route}" \
    --chrome-flags="--headless" \
    --output=html --output=json --save-assets \
    --output-path="$audit_output/$label" \
    --quiet "$@"
}

# Three mobile runs of the home page: the score varies between runs, so a
# single number says little.
for audit_iteration in 1 2 3; do
  run_audit "home-mobile-$audit_iteration" /
done
run_audit home-desktop / --preset=desktop
run_audit projects-mobile /projects
run_audit blog-mobile /blog
run_audit open-source-mobile /open-source
