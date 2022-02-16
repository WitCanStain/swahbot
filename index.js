const dotenv = require('dotenv')
dotenv.config()
const {formatDistance} = require('date-fns');
const { Client, Intents } = require('discord.js');
const {inspect} = require('util')
const {banHandler, unbanHandler} = require('./banHandler');
const {ahHandler} = require("./auctionHandler");
const {bidHandler} = require("./bidHandler");
const {moveHandler} = require("./moveHandler");
// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

const PREFIX = '!'


client.on("messageCreate", async message => {

    if (message.author.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    const regx = /(?:[^\s"]+|"[^"]*")+/g;
    const commandBody = message.content.slice(PREFIX.length);
    const params = commandBody.match(regx);
    const command = params.shift().toLowerCase();

    switch (command) {
        case 'bid':
            await bidHandler(message, params)
            break;
        case 'ahcreate':
            await ahHandler(message, params);
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
        default:
            break;
    }
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);





