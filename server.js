const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const uuid = require("uuid");
const fs = require("fs");

PORT = process.env.PORT || 4000;

// Data

let users = require("./data/users.json");
let posts = require("./data/posts.json");

const app = express();

app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SECRET
  })
);
app.use(express.urlencoded({ extended: false }));

function authorize(req, res, next) {
  if (!req.session.userID) {
    res.status(403).send("Unauthorized");
  } else {
    next();
  }
}

app.set("view engine", "ejs");

//checks if a session is currently ongoing and if not redirects to login page.
app.get("/", (req, res) => {
  if (req.session.userID) {
    const userPosts = posts.filter(post => post.owner == req.session.userID);
    const user = users.find(user => user._id == req.session.userID);
    res.render("index", { posts: userPosts, user: user.username });
  } else {
    res.render("login");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

//Registering of a user

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const repeatPassword = req.body.repeatPassword;

  if (username == "") {
    res.send("Please enter a username");
  } else if (password == repeatPassword) {
    const user = users.find(user => user.username == username);
    if (user) {
      res.send("User already exists please login");
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        _id: uuid(),
        username: username,
        passwordHash: passwordHash
      };
      users.push(newUser);
      fs.writeFileSync("./data/users.json", JSON.stringify(users));
      res.redirect("/");
    }
  } else {
    res.send("Passwords does not match");
  }
});

//logging in of a user

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = users.find(user => user.username == username);
  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (passwordMatch) {
      req.session.username = username;
      req.session.userID = user._id;
      res.redirect("/");
    } else {
      res.send("The login input is incorrect. Please try again.");
    }
  } else {
    //if
    res.send("Incorrect login");
  }
});

// Logout user
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//Add post
app.post("/add", authorize, (req, res) => {
  let newPost = {
    _id: uuid(),
    content: req.body.content,
    owner: req.session.userID
  };
  posts.push(newPost);
  fs.writeFileSync("./data/posts.json", JSON.stringify(posts));
  res.redirect("/");
});

//Deleting of a post
app.post("/delete/:id", authorize, (req, res) => {
  const id = req.params.id;
  const post = posts.find(post => post._id == id);
  if (post.owner == req.session.userID) {
    posts = posts.filter(newPost => newPost._id != id);
    fs.writeFileSync("./data/posts.json", JSON.stringify(posts));
    res.redirect("/");
  } else {
    res.status(403).send("Access denied.");
  }
});

//Editing of a post
app.post("/edit/:id", authorize, (req, res) => {
  const id = req.params.id;
  const post = posts.find(post => post._id == id);
  if (post.owner == req.session.userID) {
    post.content = req.body.content;
    fs.writeFileSync("./data/posts.json", JSON.stringify(posts));
    res.redirect("/");
  } else {
    res.status(403).send("Unauthorized");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
