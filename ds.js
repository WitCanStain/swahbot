const {Client, Intents} = require("discord.js");
const ds_client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// When the ds_client is ready, run this code (only once)
ds_client.once('ready', () => {
    console.log('Ready!');
});

ds_client.login(process.env.BOT_TOKEN);

module.exports = {ds_client};
