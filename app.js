const express = require("express");
const app = express();
const mongoose = require("mongoose");

const bodyParser = require("body-parser");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/securityDB");
}

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  Username: String,
  Password: String,
});

const Users = mongoose.model("Users", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});
app.listen(3000, function (req, res) {
  console.log("server is running");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});
app.get("/secrets", function (req, res) {
  res.render("secrets");
});

app.get("/logout", function (req, res) {
  res.redirect("/");
});

app.post("/register", function (req, res) {
  const formUsername = req.body.username;
  const formPassword = req.body.password;

  const newUser = new Users({
    Username: formUsername,
    Password: formPassword,
  });

  newUser.save(function (err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("secrets");
});
