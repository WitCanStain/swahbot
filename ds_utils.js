const {ds_client} = require("./ds");


const getRoleByName = async function(message, role_name) {
    return message.guild.roles.cache.find(role => role.name.toLowerCase() === role_name.toLowerCase());
}


const sendToChannel = async function(channel_id, message) {
    try {
        console.log(`channel_id: ${channel_id}`)
        console.log(`Sending message: ${message}`)
        return ds_client.channels.cache.get(channel_id).send(message);
    } catch (e) {
        console.error(e);
        return false;
    }
}

const sendToUser = async function(user_id, message) {
    try {
        return ds_client.users.cache.get(user_id).send(message);
    } catch (e) {
        console.error(e);
        return false;
    }
}

exports.getRoleByName = getRoleByName;
exports.sendToChannel = sendToChannel;
exports.sendToUser = sendToUser;