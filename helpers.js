// const bcrypt = require("bcrypt");

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


module.exports = {getUserByEmail, passwordLookup, emailLookup, generateRandomString}