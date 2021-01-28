const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config/config");
const fs = require("fs");
const usersRoutes = require("./routes/users");
const tokensRoutes = require("./routes/tokens");
const helpers = require("./config/helpers");
const _data = require("./data/data");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/order");

const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log("The HTTP server is running on port " + config.httpPort);
});

const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log("The HTTPS server is running on port " + config.httpsPort);
});

const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  const queryStringObject = parsedUrl.query;
  const method = req.method.toLowerCase();
  const headers = req.headers;

  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();

    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : router.notFound;

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};
      const payloadString = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

const router = {
  users: usersRoutes.users,
  tokens: tokensRoutes.tokens,
  menu: menuRoutes.menu,
  order: orderRoutes.order,
  "order/one": orderRoutes.post,
  notFound: (data, callback) => {
    callback(404, { Error: "This Route does not exist" });
  },
};
