_default:
  @just --list

build:
  @pnpm -r build

build-watch:
  @pnpm -r build:watch

prettier *args:
  @pnpm prettier {{args}} "**/*.{js,cjs,mjs,ts,cts,mts,json,md}"

fmt:
  @just prettier --write

fmt-check:
  @just prettier --check

lint:
  @pnpm -r lint

lint-fix:
  @pnpm -r lint:fix

typecheck:
  @pnpm -r typecheck

husky-precommit:
  pnpm lint-staged

husky-prepush:
  @just fmt-check
  @just spellcheck
  @just typecheck
  @just lint

publish:
  pnpm publish -r --access public

spellcheck:
  pnpm cspell --config=.cspell.json "**/*.{md,js,cjs,mjs,ts,cts,mts}"

test:
  pnpm -r test
