const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const curr_username = await req.user.username;
        const message = await Message.get(id);
        if (message.to_user.username == curr_username || message.from_user.username == curr_username) {
            return res.json({message: message});
        }
        throw new ExpressError("Access is unauthorized", 401);
    } catch (e) {
        return next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
 router.post('/', async (req, res, next) => {
    try {
        const from_username = await req.user.username;
        const { to_username, body } = req.body;
        if (!to_username || !body) {
            throw new ExpressError("All fields: to_username and body are required", 400);
          }
        const message = await Message.create({from_username, to_username, body});
        return res.json({message: message})
    } catch (e) {
        return next(e)
    }
})



/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
 router.post('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params;
        const message = await Message.get(id);
        const curr_username = await req.user.username;
        if (message.to_user.username == curr_username) {
            const result = await Message.markRead(id);
            return res.json({message: result});
        }
        throw new ExpressError("Access is unauthorized", 401);
    } catch (e) {
        return next(e)
    }
})


 module.exports = router;