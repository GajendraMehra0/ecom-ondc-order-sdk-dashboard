import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import {
  isETABreached,
  calculateEtaTime,
  isCancellable,
  cancellation,
  getPromiseBuffers,
  forceCancellation,
  autoForceCancellation,
  refund,
} from "ecom-ondc-order-sdk";

const app = express();
const port = 3000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Debug: Log views directory and check if home.ejs exists
console.log("Views directory:", app.get("views"));
const homeViewPath = path.join(__dirname, "views", "home.ejs");
console.log("Home view exists:", fs.existsSync(homeViewPath));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get("/", (_req, res) => {
  try {
     console.log("Rendering Home page");
    res.render("home");
  } catch (err) {
    console.error("Error rendering home:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Cancellable Route
app.get("/isCancellable", (req, res) => {
  try {
     console.log("rendering isCancellable page");
    res.render("isCancellable");
  } catch (err) {
    console.error("Error rendering isCancellable:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/isCancellable", (req, res) => {
  try {
    
    const orderData = req.body;
    const result = isCancellable(orderData);
    res.status(200).json({
      cancellable: result,
      message: result
        ? "The order is cancellable"
        : "The order is NOT cancellable",
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid JSON format or processing error",
      details: error.message,
    });
  }
});

// ETA Check Route
app.get("/eta-check", (req, res) => {
  try {
      console.log("rendering eta-check page");
    res.render("isETABreached", { result: undefined });
  } catch (err) {
    console.error("Error rendering isETABreached:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/check-eta", (req, res) => {
  try {
    const data = req.body;
    const result = isETABreached(data);
    res.json({
      success: true,
      breached: result,
      message: result ? "ETA Breached" : "ETA Not Breached",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Cancel Button Route
app.get("/cancelButton", (req, res) => {
  try {
          console.log("rendering cancelButton page");
    res.render("CancelButton", { result: undefined });
  } catch (err) {
    console.error("Error rendering CancelButton:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/cancelButton", (req, res) => {
  try {
    const { actor, payload } = req.body;
    if (!actor || !payload) {
      return res.status(400).json({ error: "Actor and payload are required" });
    }
    const result = cancellation(actor, payload);
    res.json({ shouldShow: result });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Force Cancellation Route
app.get("/force-cancellation", (req, res) => {
  try {
    console.log('rendering force-cancellation page')
    res.render("force_Cancellation_", { result: undefined });
  } catch (err) {
    console.error("Error rendering force_Cancellation_:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/force-cancellation", (req, res) => {
  try {
    
    const { actor, payload, cancelTriggered, onCancelReceived, ttlExpired } =
      req.body;
    const result = forceCancellation(
      actor,
      payload,
      cancelTriggered,
      onCancelReceived,
      ttlExpired
    );
    res.json({ shouldShow: result });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ETA Calculation
app.get("/calculate-Eta", (req, res) => {
  try {
    console.log('rendering calculate-Eta page')
    res.render("calculate-Eta", { result: undefined });
  } catch (err) {
    console.error("Error rendering calculate-Eta:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/calculate-eta", (req, res) => {
  try {
    const data = req.body;
    const deliveryETA = calculateEtaTime(data);
    if (!deliveryETA) {
      return res.status(400).json({ error: "Invalid delivery data" });
    }
    res.json({ eta: deliveryETA.toISOString() });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Refund Routes
app.get("/refund", (req, res) => {
  try {
    console.log('rendering refund page')
    res.render("refund", { refundResult: undefined, error: undefined });
  } catch (err) {
    console.error("Error rendering refund:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/refund", async (req, res) => {
  try {
    console.log("rendering refund page");
    const {
      actor,
      actionType,
      action,
      isETABreached,
      charge,
      on_cancelPayload,
      refundFL,
    } = req.body;

    if (
      !actor ||
      !actionType ||
      !action ||
      !charge ||
      !on_cancelPayload ||
      !refundFL
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const chargeObj = JSON.parse(charge);
    const cancelPayloadObj = JSON.parse(on_cancelPayload);
    const refundFLObj = JSON.parse(refundFL);

    const refundResult = await refund(
      actor,
      actionType,
      action,
      isETABreached,
      chargeObj,
      cancelPayloadObj,
      refundFLObj
    );

    res.status(200).json(refundResult);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Promise Buffer View
app.get("/promise-buffer/cancel", async (req, res) => {
  try {
    console.log("rendering promise-buffer page");
    const type = req.query.type || "cancellation";
    const promiseBuffers = await getPromiseBuffers(type);
    res.render("Cancel_Promise_Buffer", {
      data: promiseBuffers,
      error: null,
      selectedType: type,
    });
  } catch (error) {
    console.error("Error rendering Cancel_Promise_Buffer:", error);
    res.render("Cancel_Promise_Buffer", {
      data: [],
      error: "Failed to fetch data",
      selectedType: req.query.type || "cancellation",
    });
  }
});

// Auto Force Cancellation
app.get("/auto-force-cancel", (req, res) => {
  try {
    console.log('rendering auto-force-cancel page')
    res.render("auto_force_cancellation", { result: undefined });
  } catch (err) {
    console.error("Error rendering auto_force_cancellation:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/auto-force-cancel", (req, res) => {
  try {
    const { payload, cancelTriggered, onCancelReceived, ttlExpired } = req.body;
    const result = autoForceCancellation(
      payload,
      cancelTriggered,
      onCancelReceived,
      ttlExpired
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at: http://localhost:${port}`);
});
