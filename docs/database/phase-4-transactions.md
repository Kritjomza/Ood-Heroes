# Phase 4 Database Transactions

Each multi-row progression mutation is an atomic PostgreSQL function:

- player initialization creates one profile, wallet, starter Hero, active team,
  summon state, and AFK state under one user identity;
- Summon locks wallet/banner state, charges once, applies pity and weighted selection,
  then grants a Hero or duplicate Shards and appends history;
- team updates and slot unlocks validate ownership, uniqueness, eligibility, and cost;
- Star upgrades lock the owned Hero and deduct the required Shards once;
- combat rewards insert a unique reward-ledger identity before applying Gold and EXP;
- AFK prepare/claim uses database time, immutable pending claims, and a unique claim
  identity.

Idempotency keys and unique indexes make retries return the authoritative prior result
instead of repeating charges or grants. Row locks serialize competing requests for the
same wallet, Hero, team, banner state, or AFK state.
