const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route
app.get("/eta-check", (req, res) => {
  res.render("isETABreached");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/eta-check`);
});
