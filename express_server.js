const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['sample'],

  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const { emailLookup, generateRandomString, newDatabaseToOld} = require("./helpers");

const password = "";
const hashedPassword = bcrypt.hashSync(password, 10);

const urlDatabase = {
  // b2xVn2: { longURL: "http://www.lighthouselabs.ca",
  //   userID: "userRandomID"
  // },

  // "9sm5xK": {
  //   longURL: "http://www.google.com",
  //   userID: "user2RandomID"
  // }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  return res.redirect("/urls");
});

//get Create registration page.
app.get("/register", (req, res) => {
  const templateVars = { username: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//post for create registration page.
app.post("/register", (req, res) => {
  const newID = generateRandomString();
  let newRegistrant = {
    id: newID,
    email: req.body.email,
    password: req.body.password
  };

  if (emailLookup(req.body.email)) {
    //if email was found, redirect to homepage.
    return res.redirect("urls");
  }

  //if email was not found, HTML error page
  if (req.body.email === "" || req.body.password === "") {

    return res.redirect("/urls_error_login");
  }

  users[newID] = newRegistrant;
  req.session.user_id = newID;
  const templateVars = { user: users[req.session.user_id] };
  res.redirect("/urls");
});

//HTML error page
app.get("/urls_error", (req, res) => {
  const templateVars = { username: null };
  res.render("urls_error", templateVars);
});

//HTML error page for blank field in login.
app.get("/urls_error_login", (req, res) => {
  const templateVars = { username: null };
  res.render("urls_error_login", templateVars);
});

//new short URL
app.get("/urls/new", (req, res) => {
  let userIdFromCookie = req.session.user_id;
  //is it a redirect or an error?
  if (!userIdFromCookie) {
    return res.redirect('/login');
  }
  const templateVars = { username: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});


app.get("/urls", (req, res) => {
  let user = null;
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = { urls: newDatabaseToOld(req.session.user_id, urlDatabase),
    username: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = {longURL: req.body.longURL,
    userID: req.session.user_id};
  return res.redirect(`/urls/${shortUrl}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  
  //if not loggedin
  if (req.session.user_id === undefined) {
    const templateVars = { username: null };
    return res.render("urls_error_notloggedin", templateVars);
  }
  // //user does not have access
  // if (req.session.user_id !== urlDatabase[shortURL].userID) {
  //   const templateVars = { username: null };
  //   return res.render("urls_error_noaccess", templateVars);
  // }
  //happy path
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL , username: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  //if not loggedin.
  if (req.session.user_id === undefined) {
    const templateVars = { username: null };
    return res.render("urls_error_notloggedin", templateVars);
  }
  //create a relelvant html error page. user does not have access
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    const templateVars = { username: null };
    return res.render("urls_error_noaccess", templateVars);
  }
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  } else {
    res.send(400, "This shortURL is not associated with your login");
  }
});

//updating existing shortURL with new long URL
app.post("/urls/:shortURL", (req, res) => {

  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
   //user does not have access dosent work
   if (req.session.user_id !== urlDatabase[shortURL].userID) {
    const templateVars = { username: null };
    return res.render("urls_error_noaccess", templateVars);
  }
  urlDatabase[shortURL] = {longURL: newLongURL,
    userID: req.session.user_id};
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  let newUser = null;
  for (let key in users) {
    if (users[key].email === email) {
      newUser = users[key];
    }
  }
  let inputtedEmail = req.body.email;
  let inputtedPassword = req.body.password;
  //if either login field is empty, redirect to error. need to make a relevant HTML error.
  if (inputtedEmail === "" || inputtedPassword === "") {
    return res.redirect("/urls_error_login");
  }
  if (emailLookup(inputtedEmail)) {
    if (bcrypt.compareSync(inputtedPassword, hashedPassword)); {
      req.session.user_id = newUser.key;
    }
  } else {
    res.status(403).send({message: "This is an error 403!"});
  }
  req.session.user_id = newUser.id;
  return res.redirect("/urls");
});

// login get logic FOR A NEW LOGIN PAGE
app.get("/login", (req, res) => {
  const templateVars = {username : ""};
  res.render('urls_login', templateVars);
});


//logout logic
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//if no ShortURL, error logic
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    return res.send("THIS SHORT URL DOES NOT EXIST");
  }
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Connected. Listening on port ${PORT}!`);
  
});
