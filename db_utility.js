const {pool} = require("./db");


const getAuctionFromChannelId = async function(channel_id) {
    let auction = await pool.query(
        "SELECT * FROM auctions WHERE channel_id = $1 AND deleted=false",
        [channel_id]
    );
    if (auction.rows.length === 0) {
        console.log(`Auction not found for channel ${channel_id}`);
        return false;
    } else {
        auction = auction.rows[0];
        return auction;
    }
}

const getRoleByName = async function(message, role_name) {
    return message.guild.roles.cache.find(role => role.name.toLowerCase() === role_name.toLowerCase());
}

exports.getAuctionFromChannelId = getAuctionFromChannelId;
exports.getRoleByName = getRoleByName;