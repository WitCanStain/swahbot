const dotenv = require('dotenv')
dotenv.config()
const {formatDistance} = require('date-fns');
const { Client, Intents } = require('discord.js');
const { pool } = require("./db");
const {inspect} = require('util')
// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

const PREFIX = '!'
const DAY_MSECONDS = 24*3600*1000;
client.on("messageCreate", async message => {

    if (message.author.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    // console.log(JSON.stringify(message))
    // console.log(JSON.stringify(message.author))
    const regx = /(?:[^\s"]+|"[^"]*")+/g;
    const commandBody = message.content.slice(PREFIX.length);
    const params = commandBody.match(regx);
    const command = params.shift().toLowerCase();

    switch (command) {
        case 'bid':
            message.reply(`Hello <@${message.author.id}>`);
            break;
        case 'ahcreate':
            ahHandler(message, params);
            break;
        case 'ahban':
            banHandler(message, params)
            break;
        default:
            break;
    }



});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);


const ahHandler = async function(message, params) {
    try {
        if (!isAdmin(message)) {
            return false;
        }
        let auction = {
            channel_id: message.channelId,
            admin_id: message.author.id,
            auctioner_id: null,
            item: null,
            ign: null,
            initial_bid: null,
            duration: null,
            ticket_number: null,
            minimum_bid: 1000
        }
        if (message.mentions.members.first()) {
            auction.auctioner_id = message.mentions.members.first().id;
        } else {
            console.log("No auctioner provided, aborting...");
            return false;
        }

        if (await isBanned(auction.auctioner_id)) {
            message.reply("Oopsie woopsie, you are banned!");
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
                default:
                    break;
            }
        })
        console.log(`admin_id: ${auction.admin_id}, auctioner_id: ${auction.auctioner_id}, item: ${auction.item}, IGN: ${auction.ign}, initial_bid: ${auction.initial_bid}, duration: ${auction.duration}, ticket_number: ${auction.ticket_number}`);
        if (validateAuction(message, auction)) {
            let auction_id = await createAuction(auction);
            console.log(`Auction ${auction_id} has been created.`)
            message.reply(`An auction has been created with the following details:\nItem: ${auction.item}\nSeller IGN: ${auction.ign}\nStarting bid: ${auction.initial_bid}\nMinimum bid: ${auction.minimum_bid}\nTime: ${auction.duration}\nThis auction will end in ${formatDistance(Date.now() + auction.duration * DAY_MSECONDS, Date.now(), { addSuffix: true })}`)
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

const banHandler = async function(message, params) {

    let ban = {
        user_id: null,
        user_name: null,
        duration: null,
        reason: null,
        banner_id: message.author.id,
        banner_name: message.author.username
    }
    if (message.mentions.members.first()) {
        ban.user_id = message.mentions.members.first().id;
        ban.user_name = message.mentions.members.first().username;
    } else {
        console.log("No user provided, aborting...");
        return false;
    }

    for (const param of params) {
        let param_parts = param.split('=');
        let param_name = param_parts[0].toLowerCase();
        let param_value = param_parts[1];
        switch (param_name) {
            case 'duration':
                if (param_value === "forever") {
                    ban.duration = -1
                } else {
                    ban.duration = parseInt(param_value);
                    console.log(`ban duration: ${ban.duration}`)
                    let previous_ban = await isBanned(ban.user_id);
                    if (previous_ban) {
                        console.log(`previous ban exists`);
                        ban.duration = ban.duration + previous_ban.duration;
                    }
                }
                break;
            case 'reason':
                ban.reason = param_value;
                break;
            default:
                break;

        }

    }
    if (validateBan(ban)) {
        let success = await banUser(ban);
        if (success) {
            message.reply(`User ${ban.user_name} has been banned for ${formatDistance(Date.now() + ban.duration, Date.now())}`)
        }
    } else {
        return false;
    }


}

const validateBan = function(ban) {
    if (isNaN(ban.duration)) {
        console.log('Ban duration is not valid.');
        return false;
    } else if (!ban.user_id) {
        console.log('Must provide user id.');
        return false;
    }
    return true;
}

const banUser = async function(ban) {
    try {

        await pool.query(
            "INSERT INTO bans (user_id, duration, banner_id, reason, created, user_name, banner_name) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [ban.user_id, ban.duration, ban.banner_id, ban.reason, Date.now(), ban.user_name, ban.banner_name]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

const parseBid = function(bid) {
    console.log(`bid pre: ${bid}`)
    try {
        let modifier = bid.slice(-1);
        if (modifier === 'k' || modifier === 'm') {
            bid = bid.replaceAll(modifier, '');
            console.log(`bid prepost: ${bid}`)
            bid = parseFloat(bid);
            console.log(`bid postpost: ${bid}`)
            if (modifier === 'k') {
                bid = bid * 1000;
            } else {
                bid = bid * 1000000
            }
            bid = parseInt(bid);

        }
        console.log(`bid post: ${bid}`)
        if (!isNaN(bid)) {
            return bid;
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
    }

}

const validateAuction = function(message, auction) {

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
    } else {
        return true;
    }
}

const createAuction = async function(auction) {
    let current_time = Date.now()
    const res = await pool.query(
        "INSERT INTO auctions (channel_id, admin_id, auctioner_id, ticket_id, duration, initial_bid, item, created, minimum_bid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [auction.channel_id, auction.admin_id, auction.auctioner_id, auction.ticket_number, auction.duration, auction.initial_bid, auction.item, current_time, auction.minimum_bid]
    );
    return res.rows[0].id;
}

const isAdmin = function(message) {
    return message.member.roles.cache.some(r => r.name.toLowerCase() === "admeme" || r.name.toLowerCase() === "senor admeme");
}

const isBanned = async function(user_id) {
    const res = await pool.query(
        "SELECT user_name FROM bans WHERE user_id=($1)",
        [user_id]
    );
    if (res.rows.length > 0) {
        return res.rows[0];
    } else {
        return false;
    }
}

async function insertData() {
    const res = await pool.query(
        "INSERT INTO bids (customer_id, amount, created) VALUES ($1, $2, $3)",
        [999999, 1000, Date.now()]
    );
    console.log('done')
}

async function retrieveData() {
    try {
        const res = await pool.query("SELECT * FROM bids");
        console.log(res.rows);
    } catch (error) {
        console.error(error);
    }
}
