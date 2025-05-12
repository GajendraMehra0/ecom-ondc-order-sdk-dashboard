const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (optional)
app.use(express.static(path.join(__dirname, "public")));

// Route to render isETABreached page
app.get("/eta-check", (req, res) => {
  res.render("isETAbreached");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/eta-check`);
});
