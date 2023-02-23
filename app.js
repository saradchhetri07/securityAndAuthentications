// session And Cookies

require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bodyParser = require("body-parser");
// var md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const facebookStrategy = require("passport-facebook").Strategy;
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
var findOrCreate = require("mongoose-findorcreate");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/securityDB");
}

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "This is little secret key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  Username: String,
  Password: String,
  googleId: String,
  facebookID: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["Password"],
// });

const Users = mongoose.model("Users", userSchema);

passport.use(Users.createStrategy());

passport.serializeUser(function (Users, done) {
  done(null, Users.id);
  // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  Users.findById(id, function (err, Users) {
    done(err, Users);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      Users.findOrCreate(
        { Username: profile.displayName, googleId: profile.id },
        function (err, user) {
          console.log(user);
          return cb(err, user);
        }
      );
    }
  )
);
passport.use(
  new facebookStrategy(
    {
      clientID: process.env.APP_ID,
      clientSecret: process.env.APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secrets",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      Users.findOrCreate(
        { Username: profile.email, facebookID: profile.id },
        function (err, user) {
          console.log(user);
          return cb(err, user);
        }
      );
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});
app.listen(3000, function (req, res) {
  console.log("server is running");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/auth/google", function (req, res) {
  passport.authenticate("google", { scope: ["email", "profile"] });
});
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
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

// app.post("/register", function (req, res) {
//   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//     // Store hash in your password DB.
//     if (!err) {
//       const formUsername = req.body.username;
//       const newUser = new Users({
//         Username: formUsername,
//         Password: hash,
//       });
//       newUser.save();
//     } else {
//       res.send("error while hashing");
//     }
//   });
//   res.redirect("/");
// });

// app.post("/login", function (req, res) {
//   const formUsername = req.body.username;
//   const formPassword = req.body.password;

//   Users.findOne({ Username: formUsername }, function (err, foundUser) {
//     if (err) {
//     } else {
//       bcrypt.compare(formPassword, foundUser.Password, function (err, results) {
//         // result == false
//         if (results === true) {
//           res.render("secrets");
//         } else {
//           res.send("not a valid user");
//         }
//       });
//     }
//   });
// });

app.post("/register", function (req, res) {
  Users.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});
app.post("/login", function (req, res) {
  const user = new Users({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});
