const {client} = require("./db");
const {isAdmin, isBanned} = require("./validator");

const {validateAuction} = require("./validator");
const {formatDistance} = require("date-fns");
const {parseBid} = require("./bidHandler");


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
                default:
                    break;
            }
        })
        console.log(`admin_id: ${auction.admin_id}, auctioner_id: ${auction.auctioner_id}, item: ${auction.item}, IGN: ${auction.ign}, initial_bid: ${auction.initial_bid}, duration: ${auction.duration}, ticket_number: ${auction.ticket_number}`);
        if (validateAuction(message, auction)) {
            let auction_id = await createAuction(auction);
            console.log(`Auction ${auction_id} has been created.`)
            message.reply(`An auction has been created with the following details:\nItem: ${auction.item}\nSeller IGN: ${auction.ign}\nStarting bid: ${auction.initial_bid}\nMinimum bid: ${auction.minimum_bid}\nTime: ${auction.duration}\nThis auction will end in ${formatDistance(Date.now() + auction.duration * process.env.DAY_MSECONDS, Date.now(), { addSuffix: true })}`)
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

const createAuction = async function(auction) {
    let current_time = Date.now()
    const res = await client.query(
        "INSERT INTO auctions (channel_id, admin_id, auctioner_id, ticket_id, duration, initial_bid, item, created, minimum_bid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [auction.channel_id, auction.admin_id, auction.auctioner_id, auction.ticket_number, auction.duration, auction.initial_bid, auction.item, current_time, auction.minimum_bid]
    );
    return res.rows[0].id;
}


exports.ahHandler = ahHandler;