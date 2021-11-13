/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");


/** User of the site. */

class User {


  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({username, password, first_name, last_name, phone}) { 
    try {
      if (!username || !password || !first_name || !last_name || !phone) {
        throw new ExpressError("All fields are required", 400);
      }
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]);
      return result.rows[0];
    } catch (e) {
      if (e.code === '23505') {
        throw new ExpressError("Username taken. Please pick another!", 400);
      }
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    if (!username || !password) {
      throw new ExpressError("Username and password required", 400);
    }
    const results = await db.query(
      `SELECT username, password 
       FROM users
       WHERE username = $1`,
      [username]);
    const user = results.rows[0];
    if (user) {
      return await bcrypt.compare(password, user.password)
    }
    throw new ExpressError("Invalid username/password", 400);
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
      [username]);
    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users
        ORDER BY last_name, first_name`
    );
    return results.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const results = await db.query(
      `SELECT username,  
         first_name,  
         last_name, 
         phone, 
         join_at,
         last_login_at 
        FROM users WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];
    if (user === undefined) {
      throw new Error(`No such user: ${username}`);
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
              m.to_username,
              t.first_name,
              t.last_name,
              t.phone,                
              m.body, 
              m.sent_at,
              m.read_at   
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
        WHERE f.username = $1`,
      [username]);

    const messages = result.rows;
    if (!messages) {
      throw new ExpressError(`No message for a user: ${username}`, 404);
    }
    const messages_from = [];
    for (let i=0; i<messages.length; i++) {
      messages_from.push({
        id: messages[i].id,
        to_user: {
        username: messages[i].to_username,
        first_name: messages[i].first_name,
        last_name: messages[i].last_name,
        phone: messages[i].phone,
      },
      body: messages[i].body,
      sent_at: messages[i].sent_at,
      read_at: messages[i].read_at
    });
    return messages_from;
  }
}

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              f.first_name,
              f.last_name,
              f.phone,                
              m.body, 
              m.sent_at,
              m.read_at   
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
        WHERE t.username = $1`,
      [username]);

    const messages = result.rows;
    if (!messages) {
      throw new ExpressError(`No message for a user: ${username}`, 404);
    }
    const messages_to = [];
    for (let i=0; i<messages.length; i++) {
      messages_to.push({
        id: messages[i].id,
        from_user: {
        username: messages[i].from_username,
        first_name: messages[i].first_name,
        last_name: messages[i].last_name,
        phone: messages[i].phone,
      },
      body: messages[i].body,
      sent_at: messages[i].sent_at,
      read_at: messages[i].read_at
    });
    return messages_to;
    }
  }
}


module.exports = User;