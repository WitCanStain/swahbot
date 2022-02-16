const {isAdmin} = require("./validator");
const {getRoleByName} = require("./db_utility");


const moveHandler = async function(message, params) {
    try {
        if (!isAdmin(message)) {
            message.reply(`Only an admeme can perform this action.`);
            return false;
        }
        let server = message.guild;
        let category_name;
        let ping = params.at(-1);
        if (ping === 'PING') {
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
            await channel.lockPermissions();
            if (ping) {
                let role = await getRoleByName(message, category_name);
                channel.send(`<@&${role.id}>: A new auction has opened.`);
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

exports.moveHandler = moveHandler;