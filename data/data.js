const fs = require("fs");
const path = require("path");
const helpers = require("../config/helpers");

const lib = {};

lib.baseDir = path.join(__dirname, "/../db/");

lib.create = (dir, file, data, callback) => {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (err, fileDescriptor) => {
      if (err) {
        callback("Could not create new file, it may already exist");
      }

      const stringData = JSON.stringify(data);

      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (err) {
          callback("Error writing to new file");
        }
        fs.close(fileDescriptor, (err) => {
          if (err) {
            callback("Error closing new file");
          }
          callback(false);
        });
      });
    }
  );
};

lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

lib.update = (dir, file, data, callback) => {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (err) {
        callback("could not open the file for updating, it may not exist yet");
      }

      const stringData = JSON.stringify(data);

      fs.ftruncate(fileDescriptor, (err) => {
        if (err) {
          callback("Error Truncating file");
        }

        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (err) {
            callback("Error Writing to existing file");
          }
          fs.close(fileDescriptor, (err) => {
            if (err) {
              callback("Error closing file");
            }
            callback(false);
          });
        });
      });
    }
  );
};

lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (err) callback(err);
    callback(false);
  });
};

module.exports = lib;
