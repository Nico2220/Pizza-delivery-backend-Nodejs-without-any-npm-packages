const _data = require("../data/data");
const helpers = require("../config/helpers");
const tokensRoutes = require("./tokens");

const usersRoutes = {};

usersRoutes.users = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    usersRoutes._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

usersRoutes._users = {};

usersRoutes._users.post = (data, callback) => {
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const streetAddress =
    typeof data.payload.streetAddress === "string" &&
    data.payload.streetAddress.trim().length > 0
      ? data.payload.streetAddress
      : false;

  const email = helpers.isEmailAddress(data.payload.email)
    ? data.payload.email
    : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (firstName && lastName && streetAddress && email && password) {
    _data.read("users", email, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            streetAddress,
            email,
            password: hashedPassword,
          };

          _data.create("users", email, userObject, (err) => {
            if (err) {
              callback(500, { Error: "Could not create the new user" });
            }
            callback(200, { msg: "User registed with success" });
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        callback(400, {
          Error: "A user with that email already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

usersRoutes._users.get = (data, callback) => {
  const email = helpers.isEmailAddress(data.queryStringObject.email)
    ? data.queryStringObject.email
    : false;

  if (!email) {
    callback(400, { error: "Missing required field" });
  }

  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;
  tokensRoutes._tokens.verifyToken(token, email, (isValidToken) => {
    if (isValidToken) {
      _data.read("users", email, (err, data) => {
        if (!err && data) {
          delete data.password;
          callback(200, { ...data });
        } else {
          callback(404, { Error: "user not found" });
        }
      });
    } else {
      callback(401, { Error: "Token is not valid, authorization refused" });
    }
  });
};

usersRoutes._users.put = (data, callback) => {
  const email = helpers.isEmailAddress(data.payload.email)
    ? data.payload.email
    : false;

  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (!email) {
    callback(400, { Error: "Missing required field." });
  }
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  tokensRoutes._tokens.verifyToken(token, email, (isValidToken) => {
    if (isValidToken) {
      if (firstName || lastName || password) {
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            if (firstName) userData.firstName = firstName;
            if (lastName) userData.lastName = lastName;
            if (password) userData.password = helpers.hash(password);

            _data.update("users", email, userData, (err) => {
              if (err) {
                console.log(err);
                callback(500, { Error: "Could not update the user." });
              }
              callback(200, { msg: " User updated" });
            });
          } else {
            callback(400, { Error: "Specified user does not exist." });
          }
        });
      } else {
        callback(400, { Error: "Missing fields to update." });
      }
    } else {
      callback(401, { Error: "Token is not valid, authorization refused" });
    }
  });
};

usersRoutes._users.delete = (data, callback) => {
  const email = helpers.isEmailAddress(data.queryStringObject.email)
    ? data.queryStringObject.email
    : false;
  if (!email) {
    callback(400, { Error: "Missing required field" });
  }

  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;
  tokensRoutes._tokens.verifyToken(token, email, (isValidToken) => {
    if (isValidToken) {
      _data.read("users", email, (err, data) => {
        if (!err && data) {
          _data.delete("users", email, (err) => {
            if (err)
              callback(500, { Error: "Could not delete the specified user" });
            callback(200);
          });
        } else {
          callback(405, { Error: "Could not find the specified user." });
        }
      });
    } else {
      callback(401, { Error: "Token is not valid, authorization refused" });
    }
  });
};

module.exports = usersRoutes;
