const config = require("./config");
const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");
const StringDecoder = require("string_decoder").StringDecoder;

const helpers = {};

helpers.isEmailAddress = (email) => {
  const pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return pattern.test(email);
};

helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.hash = (str) => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.createRandomString = (strLen) => {
  strLen = typeof strLen === "number" && strLen > 0 ? strLen : false;
  let randomStr = "";

  if (strLen) {
    const possibleValue =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    for (let i = 1; i <= strLen; i++) {
      let ramdomCharater = possibleValue.charAt(
        Math.floor(Math.random() * possibleValue.length)
      );

      randomStr += ramdomCharater;
    }
    return randomStr;
  } else {
    return false;
  }
};

helpers.calculateAmount = (itemTopay) => {
  let amount = 0;
  itemsInfo = [];
  itemTopay.map((item) => {
    amount += item.amount;
    itemsInfo.push({
      name: item.menu.name,
      price: item.menu.price,
      quantity: item.quantity,
    });
  });
  return {
    itemsInfo,
    amount,
  };
};

helpers.payment = (amount, callback) => {
  const payload = {
    amount,
    currency: "usd",
    source: "tok_mastercard_debit",
  };

  const stringPayload = querystring.stringify(payload);
  const decoder = new StringDecoder("utf-8");

  const requestDetails = {
    protocol: "https:",
    hostname: "api.stripe.com",
    path: "/v1/charges",
    auth: "api-key:",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
    },
  };

  let responseData = "";
  const req = https.request(requestDetails, (res) => {
    res.on("data", (data) => {
      responseData += decoder.write(data);
    });

    res.on("end", () => {
      responseData += decoder.end();
      if (res.statusCode === 200) {
        return callback(responseData);
      }
      return callback(res.statusCode);
    });
  });

  req.on("error", (e) => {
    callback(e);
  });

  req.write(stringPayload);
  req.end();
};

helpers.sendEmail = (email, msg, callback) => {
  const payload = {
    from: `Nico <${email}>`,
    to: email,
    subject: "payment",
    text: "Payment accepted",
  };

  const stringPayload = querystring.stringify(payload);

  const requestDetails = {
    protocol: "https:",
    hostname: "api.mailgun.net",
    path: "/v3/Your Domain /messages",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
      Authorization:
        "Basic " + Buffer.from("api:" + "Your api-key").toString("base64"),
    },
  };

  const decoder = new StringDecoder("utf-8");
  const req = https.request(requestDetails, (res) => {
    let responseData = "";
    res.on("data", (data) => {
      responseData += decoder.write(data);
    });

    res.on("end", () => {
      responseData += decoder.end();
      callback(responseData);
    });
  });

  req.on("error", (e) => {
    callback(e);
  });

  req.write(stringPayload);
  req.end();
};

module.exports = helpers;
