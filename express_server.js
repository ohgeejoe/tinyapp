const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const cookies = require("cookie-parser");
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [/* secret keys */'sample'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(cookies());
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },

  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

//only if it belongs to our user cookie name (what we are passing into the function)
let newDatabaseToOld = function(userID) {
  let outputObj = {};
  for (const [key, value] of Object.entries(urlDatabase)) {
    if (userID === value.userID) {
      outputObj[key] = value.longURL;
    }
  }
  return outputObj;
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur" //only as example
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
    res.redirect("urls");
    return;
  }

  //if email was not found dont do anything.
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send({message: "This is an error 404!"});
  }

  users[newID] = newRegistrant;
  req.session.user_id = newID;
  const templateVars = { user: users[req.session.user_id] };
  // res.render("urls_register", templateVars);
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let userIdFromCookie = req.session.user_id;
  // if statment checking if user is logged in
  //is it a redirect or an error?
  if (!userIdFromCookie) {
    // setTimeout(res.status(403).send({message: "Please login!"}), 3000); 
    return res.redirect('/login'); 
  }
  const templateVars = { username: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});


app.get("/urls", (req, res) => {
  let user = null;
  // console.log(req.session);
  if (!req.session.user_id) {
    //CHANGE THIS TO AN HTML ERROR MESSAGE
    // res.status(400).send({message: "You are not logged in!"});
    return res.redirect('/login');
  }
  const templateVars = { urls: newDatabaseToOld(req.session.user_id),
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
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL , username: req.session["username"]};
  return res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // const { shortURL } = req.params;  this is called object deconstruction. works the same as line 36.
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  else {res.send(400, "This shortURL is not associated with your login")}
});

// app.post("/urls/:shortURL/delete", (req, res) => {
//   const shortURL = req.params.shortURL;
//   if(req.session.user_id === urlDatabase[shortURL].userID) {
//     delete urlDatabase[req.params.shortURL];
//     res.redirect("/urls");
//   }  else {
//     res.send(400, "You don't have the power to delete that URL :(")
//   }

//updating existing shortURL with new long URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
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
  if (emailLookup(inputtedEmail)) {
    if (bcrypt.compareSync(inputtedPassword, hashedPassword)); {
    // if (inputtedPassword === passwordLookup(inputtedEmail)) {
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
  //app.status(<code>) where to put this?
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Connected. Listening on port ${PORT}!`);
  
});

//email lookup helper function
let emailLookup = function(searchingEmailAddress) {
  for (let find in users) {
    if (searchingEmailAddress === users[find].email) {
      return true;
    }
  }
};

//password lookup helper function. returns the password not a boolean
let passwordLookup = function(searchingEmailAddress) {
  for (let find in users) {
    if (searchingEmailAddress === users[find].email) {
      return users[find].password;
    }
    console.log("password was not found");
  }
};

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

//get user by email helper function
let getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email == email) {
      return database[user].id;
    }
  }
};
