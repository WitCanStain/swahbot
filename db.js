const dotenv = require('dotenv');
dotenv.config();
const {Pool} = require("pg");
const connection_string = process.env.DATABASE_URL || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PORT}/${process.env.PGDATABASE}`
console.log(connection_string);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

// pool.connect();

module.exports = {pool};
