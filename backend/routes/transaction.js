const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("Transaction routes loaded with url");

router.post("/", async (req, res) => {
  console.log("Transaction post route hit");
  const userId = req.userId;

  try {
    const transaction = await Transaction.create({
      user: userId,
      amount: req.body.amount,
      currency: req.body.currency,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      rawText: req.body.rawText,
    });

    res.json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ sucess: false, message: "Transaction not added" });
  }
});

router.post("/parse", async (req, res) => {
  console.log("Transaction parse route hit");
  const { text } = req.body;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const prompt = `
        Extract the following fields from the transaction description:
        - amount (number, no currency symbol, e.g., $10.50 becomes 10.50)
        - currency (USD if not mentioned)
        - category (one word, e.g., Food, Transport, Shopping, Income, Other)
        - description (short summary)
        - date (ISO format YYYY-MM-DD if present, else null)
        - confidence (float between 0 and 1)
        - rawText (original text)

        Respond ONLY with valid JSON, no explanations.

        Transaction: "${text}"
        `;

    const result = await model.generateContent(prompt);
    let raw = result.response.text();
    console.log("Generative AI response:", raw);

    if (raw.startsWith("```json")) {
      raw = raw.split("```json")[1].trim();
    }
    if (raw.endsWith("```")) {
      raw = raw.split("```")[0].trim();
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
      console.log("Parsed from Generative AI:", parsed);
    } catch (e) {
      const amtMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)/);
      parsed = {
        amount: amtMatch ? parseFloat(amtMatch[1]) : null,
        currency: amtMatch ? "USD" : null,
        category: "Uncategorized",
        description: text,
        date: null,
        confidence: 1,
        rawText: text,
      };
      console.log("Failed to parse from Generative AI:", parsed);
    }

    res.json({
      success: true,
      message: "Transaction parsed successfully",
      parsed,
    });
  } catch (err) {
    console.log(err);

    const amtMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)/);
    console.log("Failed to parse from Generative AI:", amtMatch);

    const fallBackTransaction = {
      amount: amtMatch ? parseFloat(amtMatch[1]) : null,
      currency: "USD",
      category: "Uncategorized",
      description: text,
      date: null,
      confidence: 0.25,
    };

    res.json({
      success: true,
      message: "Transaction parsed successfully",
      parsed: fallBackTransaction,
    });
  }
});

router.get("/", async (req, res) => {
  console.log("Transaction get route hit");
  const userId = req.userId;

  try {
    const transactions = await Transaction.find({ user: userId });

    res.json({
      success: true,
      message:
        transactions.length === 0
          ? "No transactions found - returning empty list"
          : "Transactions found successfully",
      transactions: transactions || [], // Always return an array, even if empty
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Transactions not found" });
  }
});

router.put("/:id", async (req, res) => {
  console.log("Transaction put route hit");
  const transactionId = req.params.id;
  const userId = req.userId;

  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }
    if (transaction.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    transaction.amount = req.body.amount || transaction.amount;
    transaction.currency = req.body.currency || transaction.currency;
    transaction.category = req.body.category || transaction.category;
    transaction.description = req.body.description || transaction.description;
    transaction.date = req.body.date || transaction.date;

    await transaction.save();

    res.json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ success: false, message: "Transaction not updated" });
  }
});

router.delete("/:id", async (req, res) => {
  console.log("Transaction delete route hit");
  const transactionId = req.params.id;
  const userId = req.userId;
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }
    if (transaction.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    await transaction.deleteOne();
    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ success: false, message: "Transaction not deleted" });
  }
});

module.exports = router;
