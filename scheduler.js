const {pool} = require("./db");
const dotenv = require('dotenv')
dotenv.config()
const {getBidById, deactivateAuction, updateAuctionLastReminder} = require("./db_utils");
const {closeAuction} = require("./auctionHandler");
const {sendToChannel} = require("./ds_utils");
const {ds_client} = require("./ds");
// const {sendToChannel} = require("./ds_utils");


/**
 * This function runs periodically to check the state of auctions, alert watchers, etc
 * @returns {Promise<void>}
 */
const scheduler = function() {
    try {
        ds_client.once('ready', () => {
            auctionCheck().then(() => {
                console.log(`done`)
                pool.end();
                ds_client.destroy();
                console.log(`Scheduler run, exiting...`);
            });
        });
    } catch (e) {
        console.error(e)
    }
}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


/**
 *
 * @returns {Promise<void>}
 */
const auctionCheck = async function() {
    console.log(`Entered auctionCheck().`);
    let res = await pool.query(
        "SELECT * FROM auctions WHERE deleted=false AND active=true AND finalised=false"
    )
    const active_auctions = res.rows;
    console.log(active_auctions)
    for (const auction of active_auctions) {
        let end_time = parseInt(auction.created) + parseInt(auction.duration) * parseInt(process.env.DAY_MSECONDS);
        console.log(`end_time: ${end_time}`);
        if (end_time < Date.now()) {
            console.log(`Auction has ended, closing auction.`);
            await closeAuction(auction.id, message);
            // ds_client.channels.cache.get(auction.channel_id).send('This auction has ended.');
        }
    }
    res = await pool.query(
        "SELECT * FROM auctions WHERE deleted=false AND active=false AND finalised=false"
    )
    const unfinalised_auctions = res.rows;
    for (const auction of unfinalised_auctions) {
        if ((parseInt(auction.last_reminder) + parseInt(process.env.DAY_MSECONDS)) < Date.now()) {
            console.log(`24 hours since end of auction or last reminder, reminding.`)
            await updateAuctionLastReminder(auction.id).then(async (res) => {
                if (res) {
                    await sendToChannel(auction.channel_id, `Hey <@${auction.auctioner_id}> and <@${auction.admin_id}>, this is a reminder to finalise this auction by paying taxes if applicable and then calling !ahclose.`);
                }
            })
        }
    }
    return null;


}

return scheduler();