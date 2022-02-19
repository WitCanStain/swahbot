const {pool} = require("./db");
const {getAuctionByChannelId} = require("./db_utils");


const validateBan = function(ban) {
    console.log(JSON.stringify(ban))
    if (isNaN(ban.duration) || ban.duration < 0) {
        console.log('Ban duration is not valid.');
        return false;
    } else if (!ban.user_id) {
        console.log('Must provide user id.');
        return false;
    }
    return true;
}

const validateAuction = function(message, auction) {
    console.log(`Entered validateAuction().`)
    try {
        if (!auction.admin_id || isNaN(auction.admin_id)) {
            message.reply(`Admin id does not exist or is not numerical.`);
            return false;
        } else if (!auction.initial_bid || isNaN(auction.initial_bid) || auction.initial_bid < 0) {
            message.reply('Improper initial bid. Must be a numerical positive integer.')
            return false;
        } else if (!auction.duration || isNaN(auction.duration)) {
            message.reply('Duration does not exist or is not numerical.')
            return false;
        } else if (!auction.ign) {
            message.reply('IGN not provided.');
            return false;
        } else if (!auction.minimum_bid || isNaN(auction.minimum_bid) || auction.minimum_bid < 0) {
            message.reply('Invalid minimum bid. Must be a numerical positive integer.')
            return false;
        } else if (isNaN(auction.bin)) {
            message.reply(`Invalid BIN. Must be a numerical positive integer.`)
            return false;
        } else if (auction.bin === auction.initial_bid) {
            message.reply(`BIN may not be the same as the initial bid.`);
            return false;
        } else {
            return true;
        }
    } catch (e) {
        console.error(e);
        message.reply(`Something went wrong x.x`)
    }
}


const isAdmin = function(message) {
    try {
        return message.member.roles.cache.some(r => r.name.toLowerCase() === "admeme" || r.name.toLowerCase() === "senor admeme");
    } catch (e) {
        console.error(e);
        return false;
    }

}

const isBanned = async function(user_id) {
    try {
        let res = await pool.query(
            "SELECT user_name FROM bans WHERE user_id = $1 AND deleted=false",
            [user_id]
        );
        if (res.rows.length > 0) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
    }
}

const validateBid = async function(bid, message, auction) {
    try {
        if (!bid.amount || isNaN(bid.amount)) {
            console.log(`Improper bid amount.`);
            message.reply(`Improper bid amount. Bids must be positive integers.`);
            return false;
        }
        // let auction = await getAuctionByChannelId(bid.auction_id);
        if (!auction) {
            message.reply(`Auction not found. Check that there is an active auction in this channel.`);
            return false;
        }
        console.log(`auction: ${JSON.stringify(auction)}`);
        let high_bid_query = (await pool.query(
            "SELECT amount FROM bids WHERE id = $1 AND deleted = false",
            [auction.high_bid]
        ));
        let high_bid = (high_bid_query.rows.length > 0) ? high_bid_query.rows[0].amount : null;
        console.log(`high_bid is ${high_bid}`);

        if (bid.amount < high_bid) {
            console.log(`Bid is lower than current top bid.`);
            message.reply(`Bid is lower than current top bid.`);
            return false;
        } else if (bid.amount < parseInt(auction.initial_bid)) {
            console.log(`Bid is lower than the initial bid.`);
            message.reply(`Bid is lower than the initial bid.`);
            return false;
        } else if (high_bid && ((bid.amount - high_bid) < auction.minimum_bid)) {
            console.log(`Bid is below minimum bid amount. Minimum bid is ${auction.minimum_bid}.`);
            message.reply(`Bid is below minimum bid amount. Minimum bid is ${auction.minimum_bid}.`);
            return false;
        }

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
            return parseInt(bid);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
    }
}

exports.validateBan = validateBan;
exports.validateAuction = validateAuction;
exports.isAdmin = isAdmin;
exports.isBanned = isBanned;
exports.validateBid = validateBid;
exports.parseBid = parseBid;