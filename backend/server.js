// server.js
const express = require("express");
require('dotenv').config();  
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ---------------------------
// MasterData schema
const masterDataSchema = new mongoose.Schema({
  item: { type: String, required: true },
  unitCost: { type: Number, required: true, default: 1 }
});
const MasterData = mongoose.model("MasterData", masterDataSchema);

// ---------------------------
// DailyData schema
const dailyDataSchema = new mongoose.Schema({
  item: String,
  onHand: Number,
  unitCost: Number,
  totalCost: Number,
  date: { type: Date, default: Date.now }
});
const DailyData = mongoose.model("DailyData", dailyDataSchema);

// ---------------------------
// Multer setup for Excel uploads
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------
// Upload Master Excel File
app.post("/api/master/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File required" });

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const itemsArray = data.map(row => {
      const itemName = row["Item"]?.toString().trim();
      const unitCost = row["Unit cost"] !== undefined && row["Unit cost"] !== ""
        ? Number(row["Unit cost"])
        : 1;
      return { item: itemName, unitCost };
    }).filter(r => r.item); // skip rows without item

    const saved = await MasterData.insertMany(itemsArray);

    res.json({ message: "Master data uploaded", savedCount: saved.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// POST MasterData via JSON arrays (future-proof)
app.post("/api/master/json", async (req, res) => {
  try {
    const { items, unitCosts } = req.body;

    if (!items || !Array.isArray(items))
      return res.status(400).json({ error: "Items array required" });

    const data = items.map((item, idx) => ({
      item,
      unitCost: unitCosts?.[idx] || 1
    }));

    const saved = await MasterData.insertMany(data);
    res.json({ message: "Master data inserted via JSON", savedCount: saved.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// GET all MasterData
app.get("/api/master", async (req, res) => {
  try {
    const items = await MasterData.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Upload Daily Excel File, calculate totalCost & save
app.post("/api/daily/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File required" });

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const dailyDataExcel = xlsx.utils.sheet_to_json(sheet);

    const masterData = await MasterData.find({});

    const result = dailyDataExcel.map(daily => {
      const itemName = daily["Item"]?.toString().trim();
      const onHand = daily["On-hand"] !== undefined && daily["On-hand"] !== ""
                      ? Number(daily["On-hand"])
                      : 1;

      const masterItem = masterData.find(m => m.item === itemName);
      const unitCost = masterItem ? masterItem.unitCost : 1;
      const totalCost = unitCost * onHand;

      return { 
        item: itemName, 
        onHand, 
        unitCost, 
        totalCost,
        date: new Date()   // ✅ Date added for each row
      };
    });

    // Save to DailyData collection
    await DailyData.insertMany(result);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// GET all DailyData
app.get("/api/daily", async (req, res) => {
  try {
    const data = await DailyData.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
