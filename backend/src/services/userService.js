// backend/src/services/userService.js
const db = require("../config/database");
const creditService = require("./creditService"); // Assuming creditService is in the same directory

class UserService {
  async findOrCreateUser(profile) {
    // Check if user exists by email
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
      profile.email,
    ]);
    if (rows.length > 0) {
      // User exists, return user data
      return rows[0];
    }

    // User does not exist, create a new user
    const newUser = await db.query(
      "INSERT INTO users (email, name, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [profile.email, profile.displayName, profile.provider, profile.id]
    );

    // Create initial credit record and grant free credits
    if (newUser.rows.length > 0) {
      const userId = newUser.rows[0].id;
      await creditService.ensureUserCreditRecord(userId); // Creates the record if it doesn't exist
      await creditService.grantMonthlyFreeCredits(userId); // Grants initial free credits
    }

    return newUser.rows[0];
  }

  async findUserById(id) {
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }
}

module.exports = new UserService();

