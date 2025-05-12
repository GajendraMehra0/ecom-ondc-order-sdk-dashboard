const express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// Required to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files if needed
app.use(express.static(path.join(__dirname, "public")));

// Route to render the EJS page
app.get("/eta-check", (req, res) => {
  res.render("isETABreached");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
