const {isAdmin} = require("./validator");
const {getRoleByName, sendToChannel, sendToChannelWithoutPing} = require("./ds_utils");
const {getActiveAuctionByChannelId, setAdminForAuctionByChannelId, getNumberOfSortedTicketsForAdmin} = require("./db_utils");


const moveHandler = async function(message, params) {
    console.log(`Entered moveHandler().`);
    try {
        if (!isAdmin(message)) {
            message.reply(`Only an admeme can perform this action.`);
            return false;
        }
        let server = message.guild;
        let category_name;
        let ping = params.at(-1);
        if (ping.toLowerCase() === 'ping') {
            ping = true;
            category_name = params.slice(0, -1).join(' ').toLowerCase();
        } else {
            ping = false;
            category_name = params.join(' ').toLowerCase();
        }
        const channel_id = message.channelId
        let category = server.channels.cache.find(c => c.name.toLowerCase() === category_name && c.type === "GUILD_CATEGORY");
        let channel = server.channels.cache.find(c => c.id === channel_id && c.type === "GUILD_TEXT");
        if (category && channel) {
            await channel.setParent(category.id);
            await channel.setPosition(0);
            await channel.lockPermissions();
            await setAdminForAuctionByChannelId(message.author.id, channel_id);
            let tickets_sorted = await getNumberOfSortedTicketsForAdmin(message.author.id);
            let auction = await getActiveAuctionByChannelId(channel_id);
            await sendToChannelWithoutPing(952861469031149588, `<@${message.author.id}> sorted ticket ${auction.item}-${channel.name.slice(-4)} and has now sorted ${tickets_sorted} tickets.`);

            if (ping) {
                const role_name = getRoleNameFromCategoryName(category_name);
                if (role_name) {
                    let role = await getRoleByName(message, role_name);
                    await message.channel.setName(`${auction.item}-${channel.name.slice(-4)}`)
                        .catch(console.error);
                    channel.send(`<@&${role.id}>: A new auction has opened.`);
                }
            }

        } else {
            message.reply(`Something went wrong. Check that the category and role exist.`)
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const getRoleNameFromCategoryName = function(category_name) {
    let role_name;
    switch (category_name) {
        case 'partner auctions':
            role_name = 'rare items';
            break;
        case 'auction of the month':
            role_name = 'aotm';
            break;
        case 'vanity items':
            role_name = 'vanity';
            break;
        case 'management':
            role_name = 'admemes';
            break;
        case 'rare items':
        case 'services':
        case 'mobs and spawn eggs':
        case 'written books':
        case 'minerals':
        case 'armor':
        case 'weapons':
        case 'tools':
        case 'blocks':
        case 'enchanted books':
        case 'brews and brew recipes':
        case 'potions and foodstuffs':
        case 'miscellaneous':
            role_name = category_name;
            break;
        default:
            role_name = null;
            break;
    }
    return role_name;
}

exports.moveHandler = moveHandler;