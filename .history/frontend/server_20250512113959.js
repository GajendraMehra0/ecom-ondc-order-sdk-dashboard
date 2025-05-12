const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to render the page
app.get("/eta-check", (req, res) => {
  try {
    console.log("Rendering isETABreached page...");
    res.render("isETABreached"); // This will render the EJS file
  } catch (err) {
    console.error("Error rendering page:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/isCancallable", (req, res) => {
  try {
    console.log("Rendering isETABreached page...");
    res.render("is"); // This will render the EJS file
  } catch (err) {
    console.error("Error rendering page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/eta-check`);
});
