const {Client} = require("pg");
const connection_string = process.env.DATABASE_URL// || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PORT}/${process.env.PGDATABASE}`
console.log(connection_string);
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {client};
