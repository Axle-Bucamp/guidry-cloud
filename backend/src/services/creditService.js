// backend/src/services/creditService.js
const db = require("../config/database");
const pricing = require("../config/pricing"); // Assuming pricing config is available

// Define the amount for monthly free credit, enough for a basic LXC
// This should ideally be configurable, e.g., via environment variables or a settings table
const MONTHLY_FREE_CREDIT_AMOUNT = 5.00; // Example: $5.00, adjust based on actual pricing

class CreditService {
  async ensureUserCreditRecord(userId) {
    const { rows } = await db.query(
      "SELECT * FROM user_credits WHERE user_id = $1",
      [userId]
    );
    if (rows.length === 0) {
      // Create a new credit record for the user if it doesn't exist
      await db.query(
        "INSERT INTO user_credits (user_id, balance, last_free_credit_grant) VALUES ($1, 0, NULL)",
        [userId]
      );
      return { user_id: userId, balance: 0, last_free_credit_grant: null };
    }
    return rows[0];
  }

  async grantMonthlyFreeCredits(userId) {
    const userCredit = await this.ensureUserCreditRecord(userId);
    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();

    let grantCredits = false;
    if (!userCredit.last_free_credit_grant) {
      grantCredits = true;
    } else {
      const lastGrantDate = new Date(userCredit.last_free_credit_grant);
      const lastGrantMonth = lastGrantDate.getUTCMonth();
      const lastGrantYear = lastGrantDate.getUTCFullYear();
      if (currentYear > lastGrantYear || (currentYear === lastGrantYear && currentMonth > lastGrantMonth)) {
        grantCredits = true;
      }
    }

    if (grantCredits) {
      try {
        await db.query("BEGIN");
        await db.query(
          "UPDATE user_credits SET balance = balance + $1, last_free_credit_grant = $2 WHERE user_id = $3",
          [MONTHLY_FREE_CREDIT_AMOUNT, currentDate, userId]
        );
        await db.query(
          "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
          [userId, MONTHLY_FREE_CREDIT_AMOUNT, "free_grant", "Monthly free credit grant"]
        );
        await db.query("COMMIT");
        console.log(`Granted ${MONTHLY_FREE_CREDIT_AMOUNT} free credits to user ${userId}`);
        return { success: true, message: "Monthly free credits granted." };
      } catch (error) {
        await db.query("ROLLBACK");
        console.error(`Error granting free credits to user ${userId}:`, error);
        throw new Error("Failed to grant monthly free credits.");
      }
    }
    return { success: false, message: "Free credits already granted for this month or conditions not met." };
  }

  async addCredits(userId, amount, type = "purchase", description = "User credit purchase", paymentGatewayId = null) {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive.");
    }
    await this.ensureUserCreditRecord(userId);
    try {
      await db.query("BEGIN");
      const updatedCredit = await db.query(
        "UPDATE user_credits SET balance = balance + $1 WHERE user_id = $2 RETURNING balance",
        [amount, userId]
      );
      await db.query(
        "INSERT INTO credit_transactions (user_id, amount, type, description, payment_gateway_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, amount, type, description, paymentGatewayId, "completed"]
      );
      await db.query("COMMIT");
      return { success: true, new_balance: updatedCredit.rows[0].balance };
    } catch (error) {
      await db.query("ROLLBACK");
      console.error(`Error adding credits for user ${userId}:`, error);
      throw new Error("Failed to add credits.");
    }
  }

  async deductCredits(userId, amount, type = "usage_deduction", description = "Resource usage") {
    if (amount <= 0) {
      throw new Error("Deduction amount must be positive.");
    }
    const userCredit = await this.ensureUserCreditRecord(userId);
    if (userCredit.balance < amount) {
      throw new Error("Insufficient credits.");
    }
    try {
      await db.query("BEGIN");
      const updatedCredit = await db.query(
        "UPDATE user_credits SET balance = balance - $1 WHERE user_id = $2 RETURNING balance",
        [amount, userId]
      );
      await db.query(
        "INSERT INTO credit_transactions (user_id, amount, type, description, status) VALUES ($1, $2, $3, $4, $5)",
        [userId, -amount, type, description, "completed"]
      );
      await db.query("COMMIT");
      return { success: true, new_balance: updatedCredit.rows[0].balance };
    } catch (error) {
      await db.query("ROLLBACK");
      console.error(`Error deducting credits for user ${userId}:`, error);
      throw new Error("Failed to deduct credits.");
    }
  }

  async getUserBalance(userId) {
    const userCredit = await this.ensureUserCreditRecord(userId);
    return { user_id: userId, balance: userCredit.balance };
  }

  async getCreditTransactions(userId, limit = 20, offset = 0) {
    try {
      const { rows } = await db.query(
        "SELECT id, amount, type, description, transaction_date, status FROM credit_transactions WHERE user_id = $1 ORDER BY transaction_date DESC LIMIT $2 OFFSET $3",
        [userId, limit, offset]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching credit transactions for user ${userId}:`, error);
      throw new Error("Failed to fetch credit transactions.");
    }
  }

  // Placeholder for actual payment gateway integration (e.g., Stripe, PayPal, Crypto.com)
  async processPayment(userId, amount, paymentMethodToken, currency = 'USD') {
    // This function would interact with the chosen payment gateway's API
    // For now, it will simulate a successful payment and add credits
    console.log(`Simulating payment processing for user ${userId}, amount ${amount} ${currency} using ${paymentMethodToken}`);
    // In a real scenario: 
    // 1. Call payment gateway API with paymentMethodToken and amount.
    // 2. On successful payment confirmation from gateway:
    //    this.addCredits(userId, amount, 'purchase', 'Credit purchase via ' + paymentMethodToken, 'gateway_transaction_id');
    // 3. Handle errors from gateway.
    
    // Simulating adding credits after a "successful" payment
    return this.addCredits(userId, amount, "purchase", `Credit purchase via simulated gateway`, `sim_payment_${Date.now()}`);
  }
}

module.exports = new CreditService();

