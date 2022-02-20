const dotenv = require('dotenv');
dotenv.config();
const {inspect} = require('util');
const {banHandler, unbanHandler} = require('./banHandler');
const {ahHandler, cancelAuction, completeAuction, auctionPopulator} = require("./auctionHandler");
const {bidHandler} = require("./bidHandler");
const {moveHandler} = require("./moveHandler");
const {ds_client} = require("./ds");
const {watchAuction, unwatchAuction} = require("./watchHandler");
const {isBanned, isAdmin} = require("./validator");

const PREFIX = '!';

ds_client.on("messageCreate", async message => {

    if (message.author.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    if (!isAdmin(message)) {
        return;
    }

    let parent_id = message.channel.parent_id;
    let category = message.guild.channels.cache.find(c => c.name.toLowerCase() === "text channels" && c.id === parent_id && c.type === "GUILD_CATEGORY");
    if (category) {
        return;
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
        case 'watch':
            await watchAuction(message, params);
            break;
        case 'unwatch':
            await unwatchAuction(message, params);
            break;
        case 'ahcreate':
            await ahHandler(message, params);
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


