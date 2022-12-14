const dotenv = require('dotenv');
dotenv.config();
const {inspect} = require('util');
const {banHandler, unbanHandler} = require('./banHandler');
const {ahHandler, cancelAuction, completeAuction, auctionPopulator, changeAuction} = require("./auctionHandler");
const {bidHandler, topBid, retractBid} = require("./bidHandler");
const {moveHandler} = require("./moveHandler");
const {ds_client} = require("./ds");
const {watchAuction, unwatchAuction} = require("./watchHandler");
const {isBanned, isAdmin} = require("./validator");

const PREFIX = '!';

ds_client.on("messageCreate", async message => {

    if (message.author.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    let parent = message.channel.parent;
    let parent_name;
    if (parent) {
        parent_name = parent.name;
        console.log(`parent: ${parent_name}`);
    }
    if (parent_name) {
        if (parent_name.toLowerCase() === 'text channels') {
            return;
        }
    }


    if (await isBanned(message.author.id)) {
        console.log(`Player is banned.`)
        await message.reply(`OwOpsie woopsie, yoUwU are banned!`);
        return;
    }

    const regx = /(?:[^\s"]+|"[^"]*")+/g;
    const commandBody = message.content.slice(PREFIX.length);
    const params = commandBody.match(regx);
    const command = params.shift().toLowerCase();
    switch (command) {
        case 'bid':
            await bidHandler(message, params);
            break;
        case 'retract':
            await retractBid(message);
            break;
        case 'ahtop':
            await topBid(message);
            break;
        case 'watch':
            await watchAuction(message, params);
            break;
        case 'unwatch':
            await unwatchAuction(message, params);
            break;
        case 'ahcreate':
            await ahHandler(message, params);
            break;
        case 'ahchange':
            await changeAuction(message, params);
            break;
        case 'ah':
            await auctionPopulator(message, params);
            break;
        case 'ahcancel':
            await cancelAuction(message);
            break;
        case 'ahclose':
            completeAuction(message);
            break;
        case 'ahban':
            await banHandler(message, params);
            break;
        case 'ahunban':
            await unbanHandler(message, params);
            break;
        case 'ahmove':
            await moveHandler(message, params);
            break;
        case 'credits':
            await credits(message);
        default:
            break;
    }
});

const credits = function(message) {
    message.reply(`This Stoneworks Auction House bot was created by Wittgenstein, who is very handsome and cool.`);
}

// Login to Discord with your client's token


