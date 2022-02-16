const { Pool } = require("pg");
const connection_string = process.env.DATABASE_URL || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PORT}/${process.env.PGDATABASE}`
const pool = new Pool({connection_string});

module.exports = { pool };

