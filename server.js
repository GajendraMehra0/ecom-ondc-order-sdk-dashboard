import express from "express";
import path from "path";
import {isETABreached, calculateEtaTime, isCancellable} from "ecom-ondc-order-sdk"
import { refund } from "ecom-ondc-order-sdk"

const app = express();
const port = 3000;

// Get the current directory using import.meta.url (for ES modules)
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  try {
    console.log("Rendering ETA check page...");
    res.render("home");
  } catch (err) {
    console.error("Error rendering ETA check page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to render isCancellable page
app.get("/isCancellable", (req, res) => {
  try {
    console.log("Rendering isCancellable page...");
    res.render("isCancellable");
  } catch (err) {
    console.error("Error rendering isCancellable page:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/isCancellable', async (req, res) => {
  try {
    const orderData = req.body;
    const result = isCancellable(orderData);
    res.status(200).json({
      cancellable: result,
      message: result ? 'The order is cancellable' : 'The order is NOT cancellable',
    });
  } catch (error) {
    console.error('Error checking cancellability:', error);
    res.status(400).json({
      error: 'Invalid JSON format or processing error',
      details: error.message,
    });
  }
});

// Route to render ETA breach form
app.get("/eta-check", (req, res) => {
  try {
    console.log("Rendering ETA check page...");
    res.render("isETABreached", { result: undefined });
  } catch (err) {
    console.error("Error rendering ETA check page:", err);
    res.status(500).send("Internal Server Error ");
  }
});

// Route to handle ETA breach form submission
app.post('/check-eta', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    const result = isETABreached(data);
    res.json({
      success: true,
      breached: result,
      message: result ? 'ETA Breached' : 'ETA Not Breached'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get("/calculate-Eta", (req, res) => {
  try {
    console.log("Rendering calculate-Eta check page...");
    res.render("calculate-Eta", { result: undefined });
  } catch (err) {
    console.error("Error rendering ETA check page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle ETA breach form submission
app.post('/calculate-eta', (req, res) => {
  try {
    const data = req.body;
    console.log('body') // JSON payload from frontend
    const deliveryETA = calculateEtaTime(data); // Call the function from eta.js
    if (!deliveryETA) {
      return res.status(400).json({ error: 'Invalid delivery data' });
    }
    res.json({ eta: deliveryETA.toISOString() }); // Return ETA as ISO string
  } catch (error) {
    console.error('Error calculating ETA:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- NEW: Refund Route Starts Here ----------

// GET route to render refund input form
app.get("/refund", (req, res) => {
  console.log("GET /refund: Rendering refund page...");
  try {
    res.render("refund", { refundResult: undefined, error: undefined });
    console.log("GET /refund: Refund page rendered successfully");
  } catch (err) {
    console.error("GET /refund: Error rendering refund page:", err.message, err.stack);
    res.status(500).send("Internal Server Error");
    console.log("GET /refund: Failed to render refund page");
  }
});

// POST route to process refund
app.post('/refund', async (req, res) => {
  try {
    const { actor, actionType, action, isETABreached, charge, on_cancelPayload, refundFL } = req.body;
    console.log("🚀 ~ app.post ~ actor,", actor)

    // Validate required fields
    if (!actor || !actionType || !action || !charge || !on_cancelPayload || !refundFL) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Parse JSON strings to objects
    let chargeObj, cancelPayloadObj, refundFLObj;
    try {
      chargeObj = JSON.parse(charge);
      cancelPayloadObj = JSON.parse(on_cancelPayload);
      refundFLObj = JSON.parse(refundFL);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format in one or more payloads' });
    }

    // Call the refund function from ecom-ondc-order-sdk
    const refundResult = await refund(
      actor,
      actionType,
      action,
      isETABreached,
      chargeObj,
      cancelPayloadObj,
      refundFLObj,
    );

    // Send the result back to the frontend
    res.status(200).json(refundResult);
  } catch (error) {
    console.error('Error processing refund:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ---------- Refund Route Ends Here ----------

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});