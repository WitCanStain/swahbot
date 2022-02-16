


const {validateBan, isAdmin} = require("./validator");
const {formatDistance} = require("date-fns");
const {pool} = require("./db");

async function banHandler(message, params) {
    let ban = {
        user_id: null,
        user_name: null,
        duration: null,
        reason: null,
        banner_id: message.author.id,
        banner_name: message.author.username
    }
    let previous_ban;

    if (message.mentions.members.first()) {
        ban.user_id = message.mentions.members.first().user.id;
        ban.user_name = message.mentions.members.first().user.username;
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
                ban.duration = parseInt(param_value) * process.env.DAY_MSECONDS;
                console.log(`ban duration: ${ban.duration}`)
                previous_ban = await isBanned(ban.user_id);
                if (previous_ban) {
                    previous_ban.created = parseInt(previous_ban.created);
                    previous_ban.duration = parseInt(previous_ban.duration);
                    ban.duration = ban.duration + previous_ban.duration;
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
        let success = await banUser(ban, previous_ban);
        if (success) {
            console.log(`Ban: ${JSON.stringify(ban)}`);
            if (previous_ban) {
                message.reply(`User ${ban.user_name} was already banned for ${formatDistance( previous_ban.created + previous_ban.duration, Date.now())}. The ban has been extended to ${formatDistance(parseInt( Date.now() + ban.duration), Date.now())}.`)
            } else {
                message.reply(`User ${ban.user_name} has been banned for ${formatDistance( Date.now() + ban.duration, Date.now())}.`)
            }

        }
    } else {
        return false;
    }
}

const unbanHandler = async function(message, params) {
    try {
        if (!isAdmin(message)) {
            message.reply(`Only an admeme can perform this action.`);
            return false;
        }
        let user_id;
        if (message.mentions.members.first()) {
            user_id = message.mentions.members.first().user.id;
        } else {
            console.log("No user provided, aborting...");
            message.reply("No user provided. You must @mention a user when unbanning.")
            return false;
        }
        if (unbanUser(user_id)) {
            message.reply(`User <@${user_id}> has been unbanned.`);
        } else {
            message.reply(`Could not unban user :(`)
        }
        await pool.query(
            "DELETE FROM bans WHERE user_id = $1",
            [user_id]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

const unbanUser = async function(user_id) {
    try {
        await pool.query(
            "DELETE FROM bans WHERE user_id = $1",
            [user_id]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const banUser = async function(ban, previous_ban) {
    try {
        if (previous_ban) {
            await pool.query(
                "UPDATE bans SET duration = $1, reason = $2 WHERE id = $3",
                [ban.duration, ban.reason, previous_ban.id]
            );
        } else {
            await pool.query(
                "INSERT INTO bans (user_id, duration, banner_id, reason, created, user_name, banner_name) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [ban.user_id, ban.duration, ban.banner_id, ban.reason, Date.now(), ban.user_name, ban.banner_name]
            );
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

const isBanned = async function(user_id) {
    const res = await pool.query(
        "SELECT * FROM bans WHERE user_id=($1)",
        [user_id]
    );
    if (res.rows.length > 0) {
        return res.rows[0];
    } else {
        return false;
    }
}

exports.banHandler = banHandler;
exports.unbanHandler = unbanHandler;