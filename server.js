import express from "express";
import path from "path";
import {isETABreached} from "ecom-ondc-order-sdk"
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

// Route to render ETA breach form
app.get("/eta-check", (req, res) => {
  try {
    console.log("Rendering ETA check page...");
    res.render("isETABreached", { result: undefined });
  } catch (err) {
    console.error("Error rendering ETA check page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle ETA breach form submission
app.post("/eta-check", (req, res) => {
  try {
    const { createdAt, domain, tat, stateCode } = req.body;

    const data = {
      createdAt: new Date(createdAt).toISOString(),
      domain,
      fulfillments: [
        {
          type: "Delivery",
          "@ondc/org/TAT": tat,
          state: {
            descriptor: {
              code: stateCode,
            },
          },
        },
      ],
    };

    const result = isETABreached(data);
    res.render("isETABreached", { result: { isETABreached: result } });
  } catch (err) {
    console.error("Error processing ETA check:", err);
    res.render("isETABreached", { result: `Error: ${err.message}` });
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
app.post("/refund", (req, res) => {
  console.log("POST /refund: Received refund request");
  try {
    const {
      actor,
      actionType,
      action,
      isETABreached,
      charge,
      on_cancelPayload,
      refundFL
    } = req.body;

    console.log("POST /refund: Request body:", {
      actor,
      actionType,
      action,
      isETABreached,
      charge: typeof charge, // Log type to verify JSON parsing
      on_cancelPayload: typeof on_cancelPayload, // Log type to verify JSON parsing
      refundFL: typeof refundFL // Log type to verify JSON parsing
    });

    // Log JSON parsing attempt
    console.log("POST /refund: Parsing JSON inputs...");
    const parsedCharge = JSON.parse(charge);
    const parsedOnCancelPayload = JSON.parse(on_cancelPayload);
    const parsedRefundFL = JSON.parse(refundFL);
    console.log("POST /refund: JSON parsed successfully");

    // Log refund calculation
    console.log("POST /refund: Calculating refund with inputs:", {
      actor,
      actionType,
      action,
      isETABreached: isETABreached === "true",
      charge: parsedCharge,
      on_cancelPayload: parsedOnCancelPayload,
      refundFL: parsedRefundFL
    });

    const refundAmount = refund(
      actor,
      actionType,
      action,
      isETABreached === "true",
      parsedCharge,
      parsedOnCancelPayload,
      parsedRefundFL
    );

    console.log("POST /refund: Refund calculated successfully:", refundAmount);

    res.json({ refundResult: refundAmount });
    console.log("POST /refund: Refund page rendered with result");
  } catch (err) {
    console.error("POST /refund: Error calculating refund:", err.message, err.stack);
    res.render("refund", {
      refundResult: undefined,
      error: err.message,
    });
    console.log("POST /refund: Refund page rendered with error:", err.message);
  }
});

// ---------- Refund Route Ends Here ----------

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});