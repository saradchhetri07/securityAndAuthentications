// require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bodyParser = require("body-parser");
// var md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

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

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["Password"],
// });

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

// app.post("/register", function (req, res) {
//   const formUsername = req.body.username;
//   const formPassword = req.body.password;

//   const newUser = new Users({
//     Username: formUsername,
//     Password: md5(formPassword),
//   });

//   newUser.save(function (err) {
//     if (err) {
//       console.log(err);
//     }
//   });
//   res.redirect("secrets");
// });

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    if (!err) {
      const formUsername = req.body.username;
      const newUser = new Users({
        Username: formUsername,
        Password: hash,
      });
      newUser.save();
    } else {
      res.send("error while hashing");
    }
  });
  res.redirect("/");
});

app.post("/login", function (req, res) {
  const formUsername = req.body.username;
  const formPassword = req.body.password;

  Users.findOne({ Username: formUsername }, function (err, foundUser) {
    if (err) {
    } else {
      bcrypt.compare(formPassword, foundUser.Password, function (err, results) {
        // result == false
        if (results === true) {
          res.render("secrets");
        } else {
          res.send("not a valid user");
        }
      });
    }
  });
});
