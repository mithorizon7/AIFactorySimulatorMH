-- Apply before deploying the ownership-aware server. Existing unowned rows remain private.
ALTER TABLE game_states ADD COLUMN IF NOT EXISTS owner_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS game_states_owner_hash_unique ON game_states (owner_hash);
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS owner_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_owner_hash_unique ON leaderboard (owner_hash);
