const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");
  

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const is_user = await User.authenticate(username, password);
        if (is_user) {
            const token = jwt.sign({ username }, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({ token: token })
        }
        throw new ExpressError("Invalid username/password", 400);
    } catch (e) {
        return next(e);
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
 router.post('/register', async (req, res, next) => {
    try {
      const { username, password, first_name, last_name, phone } = req.body;
      const user = await User.register({username, password, first_name, last_name, phone});
      if (user) {
        const token = jwt.sign({ username }, SECRET_KEY);
        User.updateLoginTimestamp(username);
        return res.json({ token: token })
      }
      throw new ExpressError("Invalid user data", 400);
    } catch (e) {
        return next(e)
    }
  });


 module.exports = router;