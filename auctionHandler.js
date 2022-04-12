const {isAdmin, isBanned, parseBid} = require("./validator");
const {validateAuction} = require("./validator");
const {formatDistance} = require("date-fns");
const {deactivateAuction, getBidById, getAuctionByChannelId, deactivateAuctionByChannelId, getAuctionById,
    finaliseAuction, getActiveAuctionByChannelId, getUnfinalisedAuctionByChannelId, deleteAuction, getActiveAuctionById,
    saveIncompleteAuction, populateAuctionField, setAuctionToActiveByChannelId, getIncompleteAuctionByChannelId,
    createAuction, updateAuctionLastReminder
} = require("./db_utils");
const {sendToChannel, getChannelById, sendToChannelWithoutPing} = require("./ds_utils");
const {pool} = require("./db");


const ahHandler = async function(message, params) {
    console.log(`Entered ahHandler().`);
    try {

        let existing_auction = await getActiveAuctionByChannelId(message.channelId);
        if (existing_auction && existing_auction.active === true) {
            await sendToChannel(message.channelId, `There is already an active auction in this channel! If you need to recreate it, call !ahcancel first.`);
            return;
        }
        let auction = {
            channel_id: message.channelId,
            admin_id: null,
            auctioner_id: null,
            item: null,
            ign: null,
            initial_bid: null,
            duration: null,
            ticket_number: null,
            minimum_bid: 1000,
            bin: null
        }

        if (params.length === 0) {
            return saveIncompleteAuction(message).then((res) => {
                if (res) {
                    message.reply(`Thank you for choosing the Stoneworks Auction House.\nLet's set up your auction! What are you selling? Type \`!ah [item name]\`.`);
                    return;
                }
            });
        } else {
            if (!isAdmin(message)) {
                message.reply(`Only an admeme can create a pre-populated auction.`);
                return false;
            }
            auction.admin_id = message.author.id
        }
        if (message.mentions.members.first()) {
            auction.auctioner_id = message.mentions.members.first().id;
        } else {
            console.log("No auctioner provided, aborting...");
            return false;
        }

        if (await isBanned(auction.auctioner_id)) {
            message.reply("Oopsie woopsie, you are banned!");
            return false;
        }

        params.forEach((param) => {
            let param_parts = param.split('=');
            let param_name = param_parts[0].toLowerCase();
            let param_value = param_parts[1];
            switch(param_name) {
                case 'item':
                    auction.item = param_value.replace(/['"]+/g, '');
                    break;
                case 'ign':
                    auction.ign = param_value;
                    break;
                case 'initial_bid':
                    auction.initial_bid = parseBid(param_value);
                    break;
                case 'duration':
                    auction.duration = parseInt(param_value);
                    break;
                case 'ticket':
                    auction.ticket_number = param_value;
                    break;
                case 'minimum_bid':
                    auction.minimum_bid = parseBid(param_value);
                    break;
                case 'bin':
                    auction.bin = parseBid(param_value);
                default:
                    break;
            }
        })
        console.log(`admin_id: ${auction.admin_id}, auctioner_id: ${auction.auctioner_id}, item: ${auction.item}, IGN: ${auction.ign}, initial_bid: ${auction.initial_bid}, duration: ${auction.duration}, ticket_number: ${auction.ticket_number}`);
        if (validateAuction(message, auction)) {
            let auction_id = await createAuction(auction);
            console.log(`Auction ${auction_id} has been created.`)
            let bin_string = parseInt(auction.bin) ? `\nBIN: ${auction.bin}`: '';
            let deleted_messages = await message.channel.bulkDelete(100)
            console.log(`Deleted ${deleted_messages.size} messages in ${message.channelId}`);
            await sendToChannel(auction.channel_id, `An auction has been created with the following details:\`\`\`\nItem: ${auction.item}\nSeller IGN: ${auction.ign}\nStarting bid: ${auction.initial_bid}${bin_string}\nMinimum bid: ${auction.minimum_bid}\nDuration: ${auction.duration}\nThis auction will end ${formatDistance(Date.now() + auction.duration * process.env.DAY_MSECONDS, Date.now(), {addSuffix: true})}\`\`\`\nIf you are selling a lored or enchanted item, please provide screenshots below. I will ping you, the winner, and the responsible admin when the auction has ended.`)
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

const auctionPopulator = async function(message, params) {
    console.log(`Entered auctionPopulator().`);
    try {
        let active_auction = await getActiveAuctionByChannelId(message.channelId);
        if (active_auction) {
            message.reply(`It seems that there is already an active auction in this channel. You must cancel the previous auction using !ahcancel before creating another one.`);
            return;
        }
        let auction = await getIncompleteAuctionByChannelId(message.channelId);
        if (!auction) {
            message.reply(`It seems that there is no auction being created in this channel. You must do !ahcreate first.`);
        }
        let last_field = auction.last_filled_field;
        let channel_id = auction.channel_id;
        if (last_field !== '$ahstart' && params.length > 1) {
            message.reply(`Please ensure that there are not spaces in your answer.`);
            return;
        }
        switch (last_field) {
            case '$ahstart':
                let item = params.join(' ');
                await populateAuctionField(channel_id, 'item', item);
                message.reply(`Ok, this is what you are selling: ${item}. What world are you selling it in? Type \`!ah [world]\`. Answer must be Rathnir, Eldham, or "both".`);
                break;
            case 'item':
                let world = params[0];
                if (!['rathnir', 'eldham', 'both'].includes(world.toLowerCase())) {
                    message.reply(`The answer must either be "Rathnir", "Eldham", or "Both"!`);
                    return;
                } else {
                    await populateAuctionField(channel_id, 'world', world.toLowerCase());
                    message.reply(`Ok, you're selling it in world: ${world}. What is the duration of the auction? Type \`!ah [number of days]\`.`)
                }
                break;
            case 'world':
                let duration = params[0];
                if (isNaN(duration) || parseInt(duration) <= 0) {
                    message.reply(`Number of days must be a positive integer!`);
                    return;
                } else if (parseInt(duration) > 7) {
                    message.reply(`Maximum duration for an auction is 7 days.`);
                    return;
                } else {
                    await populateAuctionField(channel_id, 'duration', parseInt(duration));
                    message.reply(`Ok, the duration is ${duration} days. What is the starting bid? Type \`!ah [starting bid]\`. For example, \`5000\`, \`5k\`, and \`0.005m\` are acceptable values and mean the same thing.`);
                }
                break;
            case 'duration':
                let initial_bid = parseBid(params[0]);
                if (!initial_bid || initial_bid < 0) {
                    message.reply(`The initial bid must be a positive integer! Try again.`)
                    return;
                } else {
                    await populateAuctionField(channel_id, 'initial_bid', initial_bid);
                    message.reply(`Ok, the initial bid is ${initial_bid}. Is there a BIN? Type \`!ah [BIN_amount]\`. If there is no BIN, type \`!ah 0\`.`);
                }
                break;
            case 'initial_bid':
                let bin = parseBid(params[0]);
                console.log(`bin: ${bin}`)
                if (bin === false || bin < 0) {
                    message.reply(`The BIN price must be a positive integer! Try again.`);
                    return;
                } else if ((bin !== 0) && (bin <= parseInt(auction.initial_bid))) {
                    message.reply(`The BIN price must be higher than the initial bid! Try again.`);
                    return;
                }
                if (bin === 0) {
                    bin = null;
                }
                await populateAuctionField(channel_id, 'bin', bin);
                if (!bin) {
                    message.reply(`Ok, there is no BIN price. Is there a minimum bid (minimum increase amount)? Type \`!ah [minimum_bid]\`. If you want to use the default minimum bid (1000), type \`!ah 1000\` or \`!ah 0\`.`);
                } else {
                    message.reply(`Ok, the BIN is ${bin}. Is there a minimum bid (minimum increase amount)? Type \`!ah [minimum_bid]\`. If you want to use the default minimum bid (1000), type \`!ah 1000\` or \`!ah 0\`.`);
                }
                break;
            case 'bin':
                let minimum_bid = parseBid(params[0])
                if (minimum_bid === false || minimum_bid < 0) {
                    message.reply(`The minimum bid must be a non-negative integer! Try again.`);
                    return;
                }
                if (minimum_bid === 0) {
                    minimum_bid = 1000;
                }
                await populateAuctionField(channel_id, 'minimum_bid', minimum_bid);
                message.reply(`Ok, the minimum bid is ${minimum_bid}. Finally, what is your In-Game Name? Type \`!ah [name]\`.`);
                break;
            case 'minimum_bid':
                if (params.length > 1) {
                    message.reply(`That is not a valid In-Game Name...`);
                    return;
                }
                let ign = params[0];
                if (!ign) {
                    message.reply(`You must provide an IGN! Try again.`);
                    return;
                }
                await populateAuctionField(channel_id, 'ign', ign);
                await setAuctionToActiveByChannelId(channel_id);
                let bin_string = parseInt(auction.bin) ? `\nBIN: ${auction.bin}`: '';
                let deleted_messages = await message.channel.bulkDelete(100)
                console.log(`Deleted ${deleted_messages.size} messages in ${channel_id}`);
                let msg = await sendToChannel(channel_id, `An auction has been created with the following details:\`\`\`\nItem: ${auction.item}\nWorld: ${auction.world}\nSeller IGN: ${ign}\nStarting bid: ${auction.initial_bid}${bin_string}\nMinimum bid: ${auction.minimum_bid}\nDuration: ${auction.duration}\nThis auction will end ${formatDistance(Date.now() + auction.duration * process.env.DAY_MSECONDS, Date.now(), {addSuffix: true})}\`\`\`\nIf you are selling a lored or enchanted item, please provide screenshots below. I will ping you, the winner, and the responsible admin when the auction has ended.\nYou may now start bidding by doing \`!bid [amount]\`, or BIN by doing \`!bid bin\`.`)
                msg.pin();
                break;
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}



const closeAuction = async function(auction_id, channel_id) {
    console.log(`Entered closeAuction().`);
    try {
        let auction = await getActiveAuctionById(auction_id);
        let channel = await getChannelById(channel_id);
        let category;
        if (channel) {
            category = channel.guild.channels.cache.find(c => c.name.toLowerCase() === 'finished ah' && c.type === "GUILD_CATEGORY");
        } else {
            console.log(`Channel not found, likely the ticket was deleted without callin !ahclose.`);
            // await deleteAuction(auction_id);
            return;
        }
        if (category) {
            let channel_count = category.children.size;
            if (channel_count >= 48) {
                category = channel.guild.channels.cache.find(c => c.name.toLowerCase() === 'finished ah 2' && c.type === "GUILD_CATEGORY");
            }
            channel_count = category.children.size;
            if (channel_count >= 48) {
                category = channel.guild.channels.cache.find(c => c.name.toLowerCase() === 'finished ah 3' && c.type === "GUILD_CATEGORY");
            }
            await channel.setParent(category.id);
            await channel.setPosition(0);
        }
        if (auction.high_bid) {
            let bid = await getBidById(parseInt(auction.high_bid));
            if (bid) {
                await deactivateAuction(auction_id)
                await updateAuctionLastReminder(auction_id)
                await sendToChannel(auction.channel_id, `This auction by <@${auction.auctioner_id}> has now ended. Final bid: ${bid.amount}. Congratulations to <@${bid.user_id}> for winning. <@${auction.admin_id}>, please confirm that a tax of ${parseInt(bid.amount) * 0.05} is paid if applicable.`);

            }
        } else {
            await deactivateAuction(auction_id)
            await updateAuctionLastReminder(auction_id)
            await sendToChannel(auction.channel_id, `This auction by <@${auction.auctioner_id}> ended without any valid bids. You may make another auction if you wish to. <@${auction.admin_id}>`);

        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

const completeAuction = async function(message) {
    console.log(`Entered completeAuction().`)
    try {
        if (!isAdmin(message)) {
            return false;
        }
        let channel_id = message.channelId;
        let auction = await getUnfinalisedAuctionByChannelId(channel_id);
        if (!auction) {
            await sendToChannel(channel_id, `Could not find an active auction in this channel.`);
            return false;
        }
        return finaliseAuction(auction.id).then((res) => {
            sendToChannel(channel_id, `This auction has been closed.`);
            sendToChannelWithoutPing("952861469031149588", `<@${message.author.id}> has closed ticket ${auction.item}, true auction id ${auction.id}.`);
        });
    } catch (e) {
        console.error(e);
        return false;
    }
}

const cancelAuction = async function(message) {
    console.log(`Entered cancelAuction().`);
    try {
        if (!isAdmin(message)) {
            message.reply(`Only an admeme can perform this action.`)
            return false;
        }
        let channel_id = message.channelId;
        let auction = await getActiveAuctionByChannelId(channel_id);
        if (!auction) {
            await sendToChannel(channel_id, `There is no active auction in this channel.`);
            return;
        }
        deactivateAuction(auction.id).then((res) => {
            if (res) {
                finaliseAuction(auction.id).then(async(res) => {
                    if (res) {
                        deleteAuction(auction.id).then(async(res) => {
                            if (res) {
                                return sendToChannel(channel_id, `Auction ${auction.id} has been cancelled.`);
                            }
                        })
                    }
                })
            }

        })
    } catch (e) {
        console.error(e);
        return false;
    }
}


exports.ahHandler = ahHandler;
exports.closeAuction = closeAuction;
exports.cancelAuction = cancelAuction;
exports.completeAuction = completeAuction;
exports.auctionPopulator = auctionPopulator;