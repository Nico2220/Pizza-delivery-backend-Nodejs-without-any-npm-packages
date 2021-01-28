const helpers = require("../config/helpers");
const _data = require("../data/data");
const tokensRoutes = require("./tokens");
const menu = require("../data/menu");

const orderRoutes = {};

orderRoutes.order = (data, callback) => {
  const acceptableMethods = "post";
  if (acceptableMethods === data.method) {
    orderRoutes._order[data.method](data, callback);
  } else {
    callback(405);
  }
};

orderRoutes._order = {};

orderRoutes._order.post = (data, callback) => {
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  if (!token) return callback(400, { Error: "Error Missing field" });

  _data.read("tokens", token, (err, tokenData) => {
    if (err) return callback(400, { Error: "Error reading file" });

    tokensRoutes._tokens.verifyToken(token, tokenData.email, (isValidToken) => {
      if (!isValidToken) {
        return callback(401, { Error: "Token is not valid" });
      }

      _data.read("users", tokenData.email, (err, userData) => {
        if (err)
          return callback(404, {
            Error: "Could not found this specified user",
          });

        const itemsInfo = helpers.calculateAmount(userData.shoppinCart);

        helpers.payment(itemsInfo.amount * 100, (res) => {
          //   const parseRes = JSON.parse(res);

          const receip = {
            Company: "Delevery-Pizza",
            date: new Date(Date.now()),
            id: helpers.createRandomString(10),
            details: itemsInfo.itemsInfo,
            amount: itemsInfo.amount,
          };

          const StringReceip = JSON.stringify(receip);
          helpers.sendEmail(userData.email, StringReceip, (res) => {
            callback(200, {
              msg:
                "Payment succeeded, The receipt is sent to your Address Mail",
            });
          });
        });
      });
    });
  });
};

orderRoutes.post = (data, callback) => {
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;

  const menuId =
    typeof data.queryStringObject.menuId === "string"
      ? data.queryStringObject.menuId
      : false;

  const quantity =
    typeof data.payload.quantity === "number" && data.payload.quantity > 0
      ? data.payload.quantity
      : false;

  console.log(quantity);

  if (!token || !menuId || !quantity)
    return callback(400, { Error: "Error Missing field" });

  _data.read("tokens", token, (err, tokenData) => {
    if (err) return callback(400, { Error: "Error reading file" });

    tokensRoutes._tokens.verifyToken(token, tokenData.email, (isValidToken) => {
      if (!isValidToken) {
        return callback(401, { Error: "Token is not valid" });
      }

      _data.read("users", tokenData.email, (err, userData) => {
        if (err)
          return callback(404, {
            Error: "Could not found this specified user",
          });

        const menuItem = menu.find((item) => item.id === Number(menuId));
        const amount = menuItem.price * quantity;

        helpers.payment(amount * 100, (res) => {
          const parseRes = JSON.parse(res);

          const receip = {
            Company: "Delevery-Pizza",
            date: new Date(),
            id: helpers.createRandomString(10),
            details: {
              name: menuItem.name,
              price: menuItem.price,
              quantity,
            },
            amount,
          };

          const StringReceip = JSON.stringify(receip);
          helpers.sendEmail(userData.email, StringReceip, (res) => {
            callback(200, {
              msg:
                "Payment succeeded, The receipt is sent to your Address Mail",
            });
          });
        });
      });
    });
  });
};

module.exports = orderRoutes;
