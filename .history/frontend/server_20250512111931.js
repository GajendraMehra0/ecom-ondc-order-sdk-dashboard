const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// CommonJS already has __dirname and __filename
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/eta-check", (req, res) => {
  res.render("isETABreached");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
