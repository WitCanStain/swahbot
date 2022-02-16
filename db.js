const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    host: process.env.PGHOST,
});

module.exports = { pool };

