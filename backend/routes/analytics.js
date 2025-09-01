const express = require("express");
const Transaction = require("../models/Transaction");
const { default: mongoose } = require("mongoose");
const router = express.Router();

console.log("Analytics routes loaded with url");

router.get("/summary", async (req, res) => {
  console.log("Summary route hit");
  const userId = req.userId;
  try {
    const transactions = await Transaction.find({ user: userId });

    let income = 0;
    let expenses = 0;

    if (transactions && transactions.length > 0) {
      for (const t of transactions) {
        if (t.category && t.category.toLowerCase() === "income") {
          income += t.amount;
        } else {
          expenses += t.amount;
        }
      }
    }

    const savings = income - expenses;

    res.json({
      success: true,
      message:
        transactions.length === 0
          ? "No transactions found - showing empty summary"
          : "Financial summary calculated successfully",
      summary: {
        income,
        expenses,
        savings,
      },
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ success: false, message: "Failed to calculate summary" });
  }
});

router.get("/categories", async (req, res) => {
  console.log("Categories route hit");
  const userId = req.userId;

  const userObjectId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          // Exclude income from spending categories
          category: { $ne: "income", $exists: true },
        },
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: { $abs: "$amount" } }, // Use absolute values for spending
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          amount: 1, // Frontend expects 'amount', not 'total'
        },
      },
      { $sort: { amount: -1 } }, // Sort by highest spending first
    ]);

    res.json({
      success: true,
      message: "Spending by category calculated successfully",
      categories: result,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: "Failed to calculate category spending",
    });
  }
});

router.get("/trends", async (req, res) => {
  console.log("Trends route hit");
  const userId = req.userId;
  const { period = "month" } = req.query;

  let format;
  if (period === "daily") {
    format = "%Y-%m-%d";
    groupBy = { $dateToString: { format, date: "$date" } };
  } else if (period === "weekly") {
    // Group by week starting Monday, return readable date
    groupBy = {
      $dateToString: {
        format: "%Y-%m-%d",
        date: {
          $dateFromParts: {
            isoWeekYear: { $isoWeekYear: "$date" },
            isoWeek: { $isoWeek: "$date" },
            isoDayOfWeek: 1,
          },
        },
      },
    };
  } else {
    // monthly
    format = "%Y-%m";
    groupBy = { $dateToString: { format, date: "$date" } };
  }

  const userObjectId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  try {
    const result = await Transaction.aggregate([
      { $match: { user: userObjectId } }, // Only filter by user, no category filter
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          amount: { $sum: "$amount" }, // Sum all amounts as-is
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          amount: 1,
        },
      },
    ]);

    console.log("Trends aggregation result:", result);

    res.json({
      success: true,
      message: `Trends calculated successfully (grouped by ${period})`,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: "Failed to calculate trends",
    });
  }
});

module.exports = router;
