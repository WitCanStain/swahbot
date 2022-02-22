const {validateBid, parseBid} = require("./validator");
const {pool} = require("./db");
const {getAuctionWatchersFromAuctionId, getActiveAuctionByChannelId, createBid, getBidById} = require("./db_utils");
const {closeAuction} = require("./auctionHandler");
const {sendToUser, sendToChannel} = require("./ds_utils");


const bidHandler = async function (message, params) {
    console.log(`Entered bidHandler().`);
    try {
        if (params.length != 1) {
            console.log("Improper number of parameters.");
            return false;
        }
        let auction = await getActiveAuctionByChannelId(message.channelId);
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
                await closeAuction(auction.id, message);
                watchers.forEach((watcher) => {
                    if (!(watcher === bid.user_id)) {
                        sendToUser(watcher, `Hey, I'm afraid somebody has bid the BIN price and won the auction for ${auction.item} in <#${auction.channel_id}> in the Stoneworks Auction House that you also bid in. Better luck next time.`);
                    }
                })
            } else {
                message.reply(`<@${message.author.id}> has the new high bid at ${bid.amount}.`);
                watchers.forEach((watcher) => {
                    if (!(watcher === bid.user_id)) {
                        sendToUser(watcher, `Hey, just letting you know that somebody outbid you in the Stoneworks Auction House for ${auction.item} in <#${auction.channel_id}>. New high bid is ${bid.amount}.`);
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





exports.bidHandler = bidHandler;
exports.parseBid = parseBid;
exports.topBid = topBid;