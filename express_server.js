const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookies = require("cookie-parser");
app.use(cookies());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  const templateVars = { urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"]
  };
 
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL] , username: req.cookies["username"]};
  return res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // const { shortURL } = req.params;  this is called object deconstruction. works the same as line 36.
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//updating existing shortURL with new long URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL; //***req =incoming object. in this case the long url that the user inputted.
  return res.redirect(`/urls/${shortUrl}`);
});

//this is for the login routing.
app.post("/login", (req, res) => {
  const username = req.body.username; //to isolate and be able to resuse. extracting the username from the form request in _header.
  res.cookie('username', username);
  res.redirect("/urls");
});

//logout logic
app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie('username', username);
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.send("THIS SHORT URL DOES NOT EXIST");
  }
  //app.status(<code>) where to put this?
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//if no number is given to length when calling the function, it defaults to 6.
let generateRandomString = function(length = 6) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
