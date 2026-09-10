exports.up = async function(knex) {
  // Drop emirate check constraint to allow global cities (e.g. Chennai, Gurgaon, Dubai, Mumbai)
  await knex.raw(`
    ALTER TABLE sites DROP CONSTRAINT IF EXISTS emirate_check;
  `);

  // Allow latitude and longitude to default to 0 and be nullable
  await knex.raw(`
    ALTER TABLE sites ALTER COLUMN latitude DROP NOT NULL;
    ALTER TABLE sites ALTER COLUMN latitude SET DEFAULT 0;
    ALTER TABLE sites ALTER COLUMN longitude DROP NOT NULL;
    ALTER TABLE sites ALTER COLUMN longitude SET DEFAULT 0;
  `);
};

exports.down = async function(knex) {
  // Re-add default constraint if rolled back
};
