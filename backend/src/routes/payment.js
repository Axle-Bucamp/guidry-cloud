// backend/src/routes/payment.js
const express = require("express");
const router = express.Router();
const paypalService = require("../services/paypalService");
const cryptoPaymentService = require("../services/cryptoPaymentService");
const creditService = require("../services/creditService");
const { authenticateToken } = require("../middleware/auth"); // Assuming you have this middleware

// Endpoint to initiate PayPal payment
router.post("/paypal/create-payment", authenticateToken, async (req, res) => {
  const { userId, amount, currency } = req.body;
  if (!userId || !amount || !currency) {
    return res.status(400).json({ message: "User ID, amount, and currency are required." });
  }
  try {
    const paymentDetails = await paypalService.createPayment(userId, amount, currency);
    res.status(200).json(paymentDetails);
  } catch (error) {
    console.error("PayPal payment creation error:", error);
    res.status(500).json({ message: "Failed to initiate PayPal payment." });
  }
});

// Endpoint to execute PayPal payment (simulated)
router.post("/paypal/execute-payment", authenticateToken, async (req, res) => {
  const { paymentId, payerId, userId, amount } = req.body;
  if (!paymentId || !payerId || !userId || !amount) {
    return res.status(400).json({ message: "Payment ID, Payer ID, User ID, and amount are required." });
  }
  try {
    const executionResult = await paypalService.executePayment(paymentId, payerId);
    if (executionResult.success) {
      // If payment is successful, add credits to the user's account
      await creditService.addCredits(userId, parseFloat(amount), "paypal_purchase", `Credits purchased via PayPal: ${paymentId}`);
      res.status(200).json(executionResult);
    } else {
      res.status(400).json(executionResult);
    }
  } catch (error) {
    console.error("PayPal payment execution error:", error);
    res.status(500).json({ message: "Failed to execute PayPal payment." });
  }
});

// Endpoint to initiate Crypto payment (simulated)
router.post("/crypto/create-payment", authenticateToken, async (req, res) => {
  const { userId, amount, currency } = req.body;
  if (!userId || !amount || !currency) {
    return res.status(400).json({ message: "User ID, amount, and currency are required." });
  }
  try {
    const paymentDetails = await cryptoPaymentService.createPayment(userId, amount, currency);
    res.status(200).json(paymentDetails);
  } catch (error) {
    console.error("Crypto payment creation error:", error);
    res.status(500).json({ message: "Failed to initiate crypto payment." });
  }
});

// Endpoint to execute Crypto payment (simulated)
router.post("/crypto/execute-payment", authenticateToken, async (req, res) => {
  const { paymentId, transactionDetails, userId, amount } = req.body; // Added userId and amount
  if (!paymentId || !transactionDetails || !userId || !amount) {
    return res.status(400).json({ message: "Payment ID, transaction details, User ID, and amount are required." });
  }
  try {
    const executionResult = await cryptoPaymentService.executePayment(paymentId, transactionDetails);
    if (executionResult.success) {
      // If payment is successful, add credits to the user's account
      await creditService.addCredits(userId, parseFloat(amount), "crypto_purchase", `Credits purchased via Crypto: ${paymentId}`);
      res.status(200).json(executionResult);
    } else {
      res.status(400).json(executionResult);
    }
  } catch (error) {
    console.error("Crypto payment execution error:", error);
    res.status(500).json({ message: "Failed to execute crypto payment." });
  }
});


module.exports = router;

