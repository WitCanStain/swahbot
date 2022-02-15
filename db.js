const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    host: process.env.PGHOST,
});

module.exports = { pool };


// channel_id, admeme_id, auctioner_id, auctioner_ign, ticket_number, high_bid, duration, bin, initial_bid, created, updated, deleted, item, bids

// bidder_id, bid_amount, created, updated, deleted,

// CREATE TABLE auctions (id SERIAL PRIMARY KEY, channel_id NUMERIC NOT NULL, admin_id NUMERIC, auctioner_id NUMERIC, watchers NUMERIC[], ticket_id INTEGER, duration INTEGER NOT NULL, high_bid BIGINT, CONSTRAINT fk_bid FOREIGN KEY(high_bid) REFERENCES bids(id), initial_bid BIGINT NOT NULL, bids NUMERIC[], item TEXT, created BIGINT, deleted BOOL DEFAULT false);

// CREATE TABLE bids (id SERIAL PRIMARY KEY, customer_id NUMERIC, amount BIGINT, created BIGINT, deleted BOOL DEFAULT false);




