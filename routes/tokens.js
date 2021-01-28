const _data = require("../data/data");
const helpers = require("../config/helpers");

const tokensRoutes = {};

tokensRoutes.tokens = (data, callback) => {
  const allowedMethod = ["post", "get", "put", "delete"];
  if (allowedMethod.indexOf(data.method) > -1) {
    tokensRoutes._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

tokensRoutes._tokens = {};

tokensRoutes._tokens.post = (data, callback) => {
  const email = helpers.isEmailAddress(data.payload.email)
    ? data.payload.email
    : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    _data.read("users", email, (err, userData) => {
      if (!err && userData) {
        const hashedPassword = helpers.hash(password);

        if (userData.password === hashedPassword) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            email,
            tokenId,
            expires,
          };

          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (err) {
              callback(500, { Error: "Could not create a token" });
            }
            callback(200, tokenObject);
          });
        } else {
          callback(400, { Error: "Password dis not match the specified user" });
        }
      } else {
        callback(404, { Error: "This specified user not found" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fiels to create a token" });
  }
};

tokensRoutes._tokens.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (!id) {
    callback(400, { Error: "Missing required field" });
  }
  // Lookup the user
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      callback(200, tokenData);
    } else {
      callback(404, { Error: "could not find this token" });
    }
  });
};

tokensRoutes._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  if (id && extend) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires < Date.now()) {
          callback(400, {
            Error: "This token is already expired, it connot be extended",
          });
        }

        tokenData.expires = Date.now() + 1000 * 60 * 60;

        _data.update("tokens", id, tokenData, (err) => {
          if (err) {
            callback(500, {
              Error: "Could not update the token's expiration.",
            });
          }
          callback(200, tokenData);
        });
      } else {
        callback(400, { Error: "Specified user does not exist." });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid.",
    });
  }
};

tokensRoutes._tokens.delete = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (!id) {
    callback(400, { Error: "Missing required field" });
  }

  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      _data.delete("tokens", id, (err) => {
        if (err) {
          callback(500, { Error: "Could not delete the specified token" });
        }
        callback(200);
      });
    } else {
      callback(400, { Error: "Could not find the specified token." });
    }
  });
};

tokensRoutes._tokens.verifyToken = (id, email, callback) => {
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = tokensRoutes;
