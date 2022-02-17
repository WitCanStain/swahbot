const {validateBid} = require("./validator");
const {client} = require("./db");


const bidHandler = async function (message, params) {
    try {
        if (params.length != 1) {
            console.log("Improper number of parameters.");
            return false;
        }
        let bid = {
            user_id: message.author.id,
            amount: parseBid(params[0]),
            user_name: message.author.username,
            auction_id: message.channelId
        }
        console.log(`bid object: ${JSON.stringify(bid)}`)
        if (await validateBid(bid, message)) {
            console.log(`Bid: ${JSON.stringify(bid)}`);
            await createBid(bid);
            message.reply(`<@${message.author.id}> has the new high bid at ${bid.amount}.`)
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }

}

const createBid = async function(bid) {
    console.log(`Entered createBid()`)
    try {
        let res = await client.query(
            "INSERT INTO bids (user_id, amount, created, user_name, auction_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [bid.user_id, bid.amount, Date.now(), bid.user_name, bid.auction_id]
        );
        let bid_id = res.rows[0].id;
        await client.query(
            "UPDATE auctions SET high_bid = $1, bids = array_append(bids, $2) WHERE channel_id = $3",
            [bid_id, bid.user_id, bid.auction_id]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const parseBid = function(bid) {
    try {
        let modifier = bid.slice(-1);
        if (modifier === 'k' || modifier === 'm') {
            bid = bid.replaceAll(modifier, '');
            bid = parseFloat(bid);
            if (modifier === 'k') {
                bid = bid * 1000;
            } else {
                bid = bid * 1000000
            }
            bid = parseInt(bid);

        }
        if (!isNaN(bid)) {
            return bid;
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
    }

}

exports.bidHandler = bidHandler;
exports.parseBid = parseBid;