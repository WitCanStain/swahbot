const {validateBid, parseBid} = require("./validator");
const {pool} = require("./db");
const {getAuctionWatchersFromAuctionId, getActiveAuctionByChannelId, createBid, getBidById, getBidByUserId,
    getAuctionById, deleteBidById, getDeletedBidByUserIdAndAuctionId, getBidByUserIdAndChannelId, setHighBidForAuction,
    getHighBidForAuction, getAuctionByChannelId
} = require("./db_utils");
const {closeAuction} = require("./auctionHandler");
const {sendToUser, sendToChannel} = require("./ds_utils");
const { hi } = require("date-fns/locale");


const bidHandler = async function (message, params) {
    console.log(`Entered bidHandler().`);
    try {
        if (params.length != 1) {
            console.log("Improper number of parameters.");
            return false;
        }
        let auction = await getActiveAuctionByChannelId(message.channelId);
        let deleted_bid = await getDeletedBidByUserIdAndAuctionId(message.author.id, auction.channel_id);
        if (deleted_bid) {
            message.reply(`You have a deleted bid in this auction. You may no longer bid in this auction.`);
            return false;
        }
        if (params[0].toLowerCase() === 'bin') {
            if (!auction.bin) {
                message.reply(`This auction does not have a BIN price.`);
                return;
            } else {
                params[0] = auction.bin;
            }
        }
        let bid = {
            user_id: message.author.id,
            amount: parseBid(params[0]),
            user_name: message.author.username,
            auction_id: message.channelId
        }
        if (await validateBid(bid, message, auction)) {
            console.log(`Bid: ${JSON.stringify(bid)}`);
            let res = await createBid(bid);
            if (!res) {
                await sendToChannel(`Something went wrong x.x`);
                return;
            }
            let watchers = await getAuctionWatchersFromAuctionId(auction.id);
            console.log(`auction: ${JSON.stringify(auction)}, ${bid.amount}`);
            if (auction.bin && bid.amount >= parseInt(auction.bin)) {
                await sendToChannel(auction.channel_id, `<@${message.author.id}> has bid the BIN price and wins the auction.`);
                await closeAuction(auction.id, auction.channel_id);
                watchers.forEach((watcher) => {
                    if (!(watcher === bid.user_id)) {
                        sendToUser(watcher, `Hey, I'm afraid somebody has bid the BIN price and won the auction for ${auction.item} in <#${auction.channel_id}> in the Stoneworks Auction House that you also bid in. Better luck next time.`);
                    }
                })
            } else {
                message.reply(`<@${message.author.id}> has the new high bid at ${bid.amount}.`);
                watchers.forEach((watcher) => {
                    if (!(watcher === bid.user_id)) {
                        sendToUser(watcher, `Hey, just letting you know that somebody has put a bid in the Stoneworks Auction House for ${auction.item} in <#${auction.channel_id}>. New high bid is ${bid.amount}.`);
                    }
                })
            }
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }

}

const topBid = async function(message) {
    console.log(`Entered topBid().`);
    try {
        let auction = await getActiveAuctionByChannelId(message.channelId);
        if (!auction) {
            message.reply(`There is no active auction in this channel.`);
            return;
        }
        let bid = await getBidById(auction.high_bid);
        if (auction.bin) {
            message.reply(`Current top bid is ${bid.amount}. The BIN is ${auction.bin}.`);
        } else {
            message.reply(`Current top bid is ${bid.amount}. There is no BIN.`);
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const retractBid = async function(message) {
    console.log(`Entered retractBid()`);
    try {
        let user_id = message.author.id;
        let bid = await getBidByUserIdAndChannelId(user_id, message.channelId);
        console.log(`Bid to retract: ${JSON.stringify(bid)}`)
        let auction;
        if (bid) {
            auction = await getAuctionByChannelId(bid.auction_id);
            console.log(`Auction: ${JSON.stringify(auction)}`);
            if (auction) {
                if (parseInt(bid.id) === parseInt(auction.high_bid)) {
                    await deleteBidById(bid.id);
                    let high_bid = await getHighBidForAuction(auction.channel_id);
                    console.log(`retrieved high bid: ${JSON.stringify(high_bid)}`)
                    if (high_bid) {
                        await setHighBidForAuction(auction.channel_id, high_bid.id);
                    }
                    message.reply(`Okay, I have deleted your bid. You can no longer bid in this auction.`);
                } else {
                    message.reply(`Your bid is not the top bid, not deleting bid.`);
                }
            } else {
                console.log(`Auction ${message.channelId} not found.`)
            }

        } else {
            message.reply(`You have no bids in this auction.`);
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}





exports.bidHandler = bidHandler;
exports.parseBid = parseBid;
exports.topBid = topBid;
exports.retractBid = retractBid;