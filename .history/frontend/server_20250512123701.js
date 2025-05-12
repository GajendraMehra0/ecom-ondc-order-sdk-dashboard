const express = require("express");
const path = require("path");
const { isETABreached } = require("../src/eta"); // Adjust this path to match your project

const app = express();
const port = 3000;

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to render isCancellable page
app.get("/isCancellable", (req, res) => {
  try {
    console.log("Rendering isCancellable page...");
    res.render("isCancellable"); // You must have views/isCancellable.ejs
  } catch (err) {
    console.error("Error rendering isCancellable page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to render ETA breach form
app.get("/eta-check", (req, res) => {
  try {
    console.log("Rendering ETA check page...");
    res.render("isETABreached", { result: undefined }); // You must have views/etaCheck.ejs
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
    res.render("etaCheck", { result });
  } catch (err) {
    console.error("Error processing ETA check:", err);
    res.render("isETABreached", { result: `Error: ${err.message}` });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
