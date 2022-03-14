const {pool} = require("./db");


const getAuctionByChannelId = async function(channel_id) {
    console.log(`Entered getAuctionByChannelId().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE channel_id = $1 AND deleted=false",
            [channel_id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for channel ${channel_id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const setAdminForAuctionByChannelId = async function(admin_id, channel_id) {
    console.log(`Entered setAdminForAuctionByChannelId().`);
    try {
        await pool.query(
            "UPDATE auctions SET admin_id=$1 WHERE channel_id=$2",
            [admin_id, channel_id]
        );
        return true;
    }catch (e) {
        console.error(e);
        return false;
    }
}

const getNumberOfSortedTicketsForAdmin = async function(admin_id) {
    console.log(`Entered getNumberOfSortedTicketsForAdmin().`);
    try {
        let response = await pool.query(
            "SELECT COUNT (*) AS \"no_of_tickets\" FROM auctions WHERE admin_id=$1",
            [admin_id]
        );
        if (response.rows.length > 0) {
            return response.rows[0]["no_of_tickets"];
        } else {
            return "0";
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

const getNumberOfClosedTicketsForAdmin = async function(admin_id) {
    console.log(`Entered getNumberOfSortedTicketsForAdmin().`);
    try {
        let response = await pool.query(
            "SELECT COUNT (*) AS \"no_of_closed_tickets\" FROM auctions WHERE admin_id=$1",
            [admin_id]
        );
        if (response.rows.length > 0) {
            return response.rows[0]["no_of_closed_tickets"];
        } else {
            return "0";
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

const getIncompleteAuctionByChannelId = async function(channel_id) {
    console.log(`Entered getInactiveAuctionByChannelId().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE channel_id = $1 AND deleted=false AND active=false",
            [channel_id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for channel ${channel_id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getActiveAuctionByChannelId = async function(channel_id) {
    console.log(`Entered getActiveAuctionByChannelId().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE channel_id = $1 AND deleted=false AND active=true",
            [channel_id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for channel ${channel_id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getUnfinalisedAuctionByChannelId = async function(channel_id) {
    console.log(`Entered getUnfinalisedAuctionByChannelId().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE channel_id = $1 AND deleted=false AND finalised=false",
            [channel_id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for channel ${channel_id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getActiveAuctionById = async function(id) {
    console.log(`Entered getActiveAuctionById().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE id = $1 AND deleted=false AND active=true",
            [id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for channel ${id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getAuctionById = async function(id) {
    console.log(`Entered getAuctionById().`);
    try {
        let auction = await pool.query(
            "SELECT * FROM auctions WHERE id = $1 AND deleted=false",
            [id]
        );
        if (auction.rows.length === 0) {
            console.log(`Auction not found for id ${id}`);
            return false;
        } else {
            auction = auction.rows[0];
            return auction;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getBidById = async function(id) {
    console.log(`Entered getBidById().`);
    try {
        let res = await pool.query(
            "SELECT * FROM bids WHERE id=$1 AND deleted=false",
            [id]
        );
        const bid = res.rows;
        if (bid.length > 0) {
            return bid[0];
        } else {
            return false;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getDeletedBidByUserIdAndAuctionId = async function(user_id, auction_id) {
    console.log(`Entered getDeletedBidByUserIdAndAuctionId().`);
    try {
        let res = await pool.query(
            "SELECT * FROM bids WHERE user_id=$1 AND auction_id=$2 AND deleted=true",
            [user_id, auction_id]
        );
        const bid = res.rows;
        if (bid.length > 0) {
            return bid[0];
        } else {
            return false;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getBidByUserId = async function(id) {
    console.log(`Entered getBidById().`);
    try {
        let res = await pool.query(
            "SELECT * FROM bids WHERE user_id=$1 AND deleted=false",
            [id]
        );
        const bid = res.rows;
        if (bid.length > 0) {
            return bid[0];
        } else {
            return false;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const deleteBidById = async function(id) {
    console.log(`Entered deleteBidById().`);
    try {
        let res = await pool.query(
            "UPDATE bids SET deleted=true WHERE id=$1",
            [id]
        );
        return true;
    } catch (e) {
        console.error(e)
        return false;
    }
}

const deactivateAuction = async function(id) {
    console.log(`Entered deactivateAuction().`);
    try {
        await pool.query(
            "UPDATE auctions SET active=false WHERE id=$1",
            [id]
        )
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const finaliseAuction = async function(id) {
    console.log(`Entered finaliseAuction().`);
    try {
        await pool.query(
            "UPDATE auctions SET finalised=true WHERE id=$1",
            [id]
        )
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}


const updateAuctionLastReminder = async function(auction_id) {
    console.log(`Entered updateAuctionLastReminder().`);
    try {
        let res = await pool.query(
            "UPDATE auctions SET last_reminder=$1 WHERE id=$2",
            [Date.now(), auction_id]
        )
        return true;
    } catch (e) {
        console.error(e)
        return false;
    }
}

const addWatcherToAuction = async function(user_id, channel_id) {
    console.log(`Entered addWatcherToAuction().`);
    try {
        let res = await pool.query(
            "UPDATE auctions SET watchers=array_append(watchers, $1) WHERE channel_id=$2 AND active=true",
            [user_id, channel_id]
        )
        if (res) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e)
        return false;
    }
}

const removeWatcherFromAuction = async function(user_id, channel_id) {
    console.log(`removeWatcherFromAuction().`);
    try {
        let res = await pool.query(
            "UPDATE auctions SET watchers=array_remove(watchers, $1) WHERE channel_id=$2",
            [user_id, channel_id]
        )
        if (res) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
    }
}

const getBidByUserIdAndChannelId = async function(user_id, auction_id) {
    console.log(`Entered getBidByUserIdAndChannelId().`);
    try {
        let res = await pool.query(
            "SELECT * FROM bids WHERE user_id=$1 AND auction_id=$2 AND deleted=false ORDER BY created DESC LIMIT 1",
            [user_id, auction_id]
        );
        const bid = res.rows;
        if (bid.length > 0) {
            return bid[0];
        } else {
            return false;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const getAuctionWatchersFromAuctionId = async function(id) {
    console.log(`Entered getAuctionWatchersFromAuctionId().`);
    try {
        let auction = await pool.query(
            "SELECT watchers FROM auctions WHERE id = $1 AND deleted=false",
            [id]
        );
        console.log(auction.rows);
        if (auction.rows.length === 0) {
            console.log(`Auction not found for id ${id}`);
            return false;
        } else {
            let watchers = auction.rows[0].watchers || [];
            return watchers;
        }
    } catch (e) {
        console.error(e)
        return false;
    }
}

const saveIncompleteAuction = async function(message) {
    console.log(`Entered saveIncompleteAuction().`);
    try {
        await pool.query(
            "INSERT INTO auctions (channel_id, active, last_filled_field, auctioner_id, created) VALUES ($1, false, '$ahstart', $2, $3)",
            [message.channelId, message.author.id, Date.now()]
        )
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const populateAuctionField = async function(channel_id, column, value) {
    console.log(`Entered saveIncompleteAuction().`);
    try {
        await pool.query(
            `UPDATE auctions SET ${column}=$2, last_filled_field=$1 WHERE channel_id=$3 AND deleted=FALSE AND active=FALSE`,
            [column, value, channel_id]
        )
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const setAuctionToActiveByChannelId = async function(channel_id) {
    console.log(`Entered setAuctionToActiveByChannelId`)
    try {
        await pool.query(
            "UPDATE auctions SET active=true WHERE channel_id=$1",
            [channel_id]
        );
    } catch (e) {
        console.error(e);
        return false;

    }
}

const deleteAuction = async function(id) {
    console.log(`Entered deleteAuction().`);
    try {
        await pool.query(
            "UPDATE auctions SET deleted=true WHERE id=$1",
            [id]
        )
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
const createBid = async function(bid) {
    console.log(`Entered createBid().`)
    try {
        let res = await pool.query(
            "INSERT INTO bids (user_id, amount, created, user_name, auction_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [bid.user_id, bid.amount, Date.now(), bid.user_name, bid.auction_id]
        );
        let bid_id = res.rows[0].id;
        await pool.query(
            "UPDATE auctions SET high_bid = $1, bids = array_append(bids, $2) WHERE channel_id = $3",
            [bid_id, bid.user_id, bid.auction_id]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

const createAuction = async function(auction) {
    let current_time = Date.now()
    const res = await pool.query(
        "INSERT INTO auctions (channel_id, admin_id, auctioner_id, ticket_id, duration, initial_bid, item, created, minimum_bid, last_reminder, bin, ign) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
        [auction.channel_id, auction.admin_id, auction.auctioner_id, auction.ticket_number, auction.duration, auction.initial_bid, auction.item, current_time, auction.minimum_bid, current_time + auction.duration, auction.bin, auction.ign]
    );
    return res.rows[0].id;
}

const getHighBidForAuction = async function(auction_id) {
    console.log(`Entered getHighBidForAuction().`);
    try {
        let bid = await pool.query(
            "SELECT * FROM bids WHERE auction_id = $1 AND deleted=false ORDER BY created DESC LIMIT 1",
            [auction_id]
        );
        if (bid.rows.length === 0) {
            console.log(`High bid not found for channel ${auction_id}`);
            return false;
        } else {
            bid = bid.rows[0];
            return bid;
        }
    } catch (e) {
        console.error(e)
        return false;
    }

}

const setHighBidForAuction = async function(auction_id, high_bid_id) {
    console.log(`Entered setHighBidForAuction().`);
    try {
        let res = await pool.query(
            "UPDATE auctions SET high_bid=$1 WHERE id=$2",
            [high_bid_id, auction_id]
        )
        return true;
    } catch (e) {
        console.error(e)
        return false;
    }
}


exports.getAuctionByChannelId = getAuctionByChannelId;
exports.getBidById = getBidById;
exports.deactivateAuction = deactivateAuction;
exports.updateAuctionLastReminder = updateAuctionLastReminder;
exports.getAuctionById = getAuctionById;
exports.finaliseAuction = finaliseAuction;
exports.getActiveAuctionByChannelId = getActiveAuctionByChannelId;
exports.getActiveAuctionById = getActiveAuctionById;
exports.getUnfinalisedAuctionByChannelId = getUnfinalisedAuctionByChannelId;
exports.addWatcherToAuction = addWatcherToAuction;
exports.getBidByUserIdAndChannelId = getBidByUserIdAndChannelId;
exports.getAuctionWatchersFromAuctionId = getAuctionWatchersFromAuctionId;
exports.removeWatcherFromAuction = removeWatcherFromAuction;
exports.deleteAuction = deleteAuction;
exports.createBid = createBid;
exports.saveIncompleteAuction = saveIncompleteAuction;
exports.populateAuctionField = populateAuctionField;
exports.setAuctionToActiveByChannelId = setAuctionToActiveByChannelId;
exports.getIncompleteAuctionByChannelId = getIncompleteAuctionByChannelId;
exports.createAuction = createAuction;
exports.setAdminForAuctionByChannelId = setAdminForAuctionByChannelId;
exports.getNumberOfSortedTicketsForAdmin = getNumberOfSortedTicketsForAdmin;
exports.deleteBidById = deleteBidById;
exports.getDeletedBidByUserIdAndAuctionId = getDeletedBidByUserIdAndAuctionId;
exports.getHighBidForAuction = getHighBidForAuction;
exports.setHighBidForAuction = setHighBidForAuction;