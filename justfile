_default:
  @just --list

build:
  @pnpm -r build

prettier *args:
  pnpm prettier {{args}} "**/*.{js,cjs,mjs,ts,cts,mts,json,md}"

fmt:
  @just prettier --write

fmt-check:
  @just prettier --check

husky-precommit:
  pnpm lint-staged

husky-prepush:
  @just fmt-check
  @just spellcheck
  @pnpm -r typecheck
  @pnpm -r lint

publish:
  pnpm publish -r --access public

spellcheck:
  pnpm cspell --config=.cspell.json "**/*.{md,js,cjs,mjs,ts,cts,mts}"
