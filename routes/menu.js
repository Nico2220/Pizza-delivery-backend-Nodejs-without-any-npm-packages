const _data = require("../data/data");
const helpers = require("../config/helpers");
const tokensRoutes = require("../routes/tokens");
const menu = require("../data/menu");
const usersRoutes = require("./users");

const menuRoutes = {};

menuRoutes.menu = (data, callback) => {
  const allowedMethod = ["post", "get", "put", "delete"];
  if (allowedMethod.indexOf(data.method) > -1) {
    menuRoutes._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

menuRoutes._menu = {};

menuRoutes._menu.post = (data, callback) => {
  const menuId =
    typeof data.queryStringObject.menuId === "string"
      ? data.queryStringObject.menuId
      : false;

  const quantity =
    typeof data.payload.quantity === "number" && data.payload.quantity > 0
      ? data.payload.quantity
      : false;

  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  if (menuId && quantity) {
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        tokensRoutes._tokens.verifyToken(
          token,
          tokenData.email,
          (isValidToken) => {
            if (isValidToken) {
              const chosenMenu = menu.find(
                (item) => item.id === Number(menuId)
              );
              const documentId = helpers.createRandomString(10);
              const shoppinCart = {
                documentId,
                menu: chosenMenu,
                quantity,
                user: tokenData.email,
                amount: quantity * chosenMenu.price,
              };

              _data.create("shoppinCart", documentId, shoppinCart, (err) => {
                if (err) {
                  callback(500, {
                    Error: "cannot add product to shopping cart",
                  });
                }

                _data.read("users", tokenData.email, (err, userData) => {
                  if (!err && userData) {
                    const userShoppingCart =
                      typeof userData.shoppinCart == "object" &&
                      userData.shoppinCart instanceof Array
                        ? userData.shoppinCart
                        : [];

                    delete shoppinCart.user;

                    userData.shoppinCart = userShoppingCart;
                    userData.shoppinCart.push(shoppinCart);

                    _data.update("users", userData.email, userData, (err) => {
                      if (err) {
                        callback(500, { Error: "Could not update the user" });
                      }

                      callback(200, { msg: "Menu added to shopping cart" });
                    });
                  } else {
                    callback(404, {
                      Error: "Could not find this specified user",
                    });
                  }
                });
              });
            } else {
              callback(401, {
                Error: "Token is not valid, authorization refused",
              });
            }
          }
        );
      } else {
        callback(404, { Error: "Could not find the token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required filds" });
  }
};

menuRoutes._menu.get = (data, callback) => {
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      tokensRoutes._tokens.verifyToken(
        token,
        tokenData.email,
        (isValidToken) => {
          if (isValidToken) {
            callback(200, menu);
          } else {
            callback(401, {
              Error: "Token is not valid, authorization refused",
            });
          }
        }
      );
    } else {
      callback(404, { Error: "Could not find the token" });
    }
  });
};

menuRoutes._menu.put = (data, callback) => {
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  const documentId =
    typeof data.queryStringObject.documentId === "string"
      ? data.queryStringObject.documentId
      : false;

  const quantity =
    typeof data.payload.quantity === "number" && data.payload.quantity > 0
      ? data.payload.quantity
      : false;

  console.log(quantity, documentId);

  if (documentId && quantity) {
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        tokensRoutes._tokens.verifyToken(
          token,
          tokenData.email,
          (isValidToken) => {
            if (isValidToken) {
              _data.read("shoppinCart", documentId, (err, shoppinCartData) => {
                if (!err && shoppinCartData) {
                  shoppinCartData.quantity = Number(quantity);

                  _data.update(
                    "shoppinCart",
                    documentId,
                    shoppinCartData,
                    (err) => {
                      if (err) {
                        callback(500, { Error: "Error updating file" });
                      }

                      _data.read(
                        "users",
                        shoppinCartData.user,
                        (err, userData) => {
                          if (!err && userData) {
                            const menuTomodify = userData.shoppinCart.find(
                              (item) => item.documentId === documentId
                            );
                            menuTomodify.quantity = quantity;

                            _data.update(
                              "users",
                              userData.email,
                              userData,
                              (err) => {
                                if (err) {
                                  callback(500, {
                                    Error: "Error updating file",
                                  });
                                }
                                callback(200, {
                                  msg: "shopping cart updated with success",
                                });
                              }
                            );
                          } else {
                            callback(500, { Error: "Error reading this file" });
                          }
                        }
                      );
                    }
                  );
                } else {
                  callback(500, { Error: "Error reading shoppingCart file " });
                }
              });
            } else {
              callback(401, { Error: "Token is not valid" });
            }
          }
        );
      } else {
        callback(404, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing field to update the shopping card" });
  }
};

menuRoutes._menu.delete = (data, callback) => {
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  const documentId =
    typeof data.queryStringObject.documentId === "string"
      ? data.queryStringObject.documentId
      : false;

  if (documentId) {
    _data.read("shoppinCart", documentId, (err, shoppinCartData) => {
      if (!err && shoppinCartData) {
        tokensRoutes._tokens.verifyToken(
          token,
          shoppinCartData.user,
          (isValidToken) => {
            if (isValidToken) {
              _data.delete("shoppinCart", documentId, (err) => {
                if (err) {
                  callback(500, { Error: "Error deleting file" });
                }

                _data.read("users", shoppinCartData.user, (err, userData) => {
                  if (!err && userData) {
                    userData.shoppinCart = userData.shoppinCart.filter(
                      (item) => item.documentId !== documentId
                    );

                    console.log(userData);

                    _data.update("users", userData.email, userData, (err) => {
                      if (err) {
                        callback(500, { Error: "Error updating file" });
                      } else {
                        callback(200);
                      }
                    });
                  } else {
                    callback(500, { Error: "Error reading file" });
                  }
                });
              });
            } else {
              callback(401, { Error: "Token is not valid" });
            }
          }
        );
      } else {
        callback(500, { Error: "Error reading file" });
      }
    });
  } else {
    callback(400, { Error: "Missing field to delete" });
  }
};
module.exports = menuRoutes;
