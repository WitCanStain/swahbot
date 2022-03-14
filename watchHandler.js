const {addWatcherToAuction, getBidByUserIdAndChannelId, removeWatcherFromAuction} = require("./db_utils");


const watchAuction = async function(message, params) {
    console.log(`Entered watchAuction().`);
    try {
        let user_id = message.author.id;
        console.log(`user_id: ${user_id}`)
        let channel_id = message.channelId;
        // let bid = await getBidByUserIdAndChannelId(user_id, channel_id);
        // if (!bid) {
        //     message.reply(`You have no bids in this auction.`);
        //     return false;
        // }
        let res = await addWatcherToAuction(user_id, channel_id);
        if (res) {
            message.reply(`Okay, I will alert you when somebody outbids you.`)
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const unwatchAuction = async function(message, params) {
    console.log(`Entered unwatchAuction().`);
    try {
        let user_id = message.author.id;
        let channel_id = message.channelId;
        let bid = await getBidByUserIdAndChannelId(user_id, channel_id);
        console.log(bid);
        if (!bid) {
            message.reply(`You have no bids in this auction.`);
            return false;
        }
        let res = await removeWatcherFromAuction(user_id, channel_id);
        if (res) {
            message.reply(`Okay, I will no longer alert you about this auction.`)
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

exports.watchAuction = watchAuction;
exports.unwatchAuction = unwatchAuction;