/**
  Copyright (c) 2015, 2023, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

// 'use strict';

// module.exports = function (configObj) {
//   return new Promise((resolve, reject) => {
//   	console.log("Running after_build hook.");
//   	resolve(configObj);
//   });
// };

"use strict";
const fs = require("fs");
const archiver = require("archiver");

module.exports = function (configObj) {
  return new Promise((resolve, reject) => {
    console.log("Running after_build hook.");
    const output = fs.createWriteStream("UAN.zip");
    const archive = archiver("zip");

    output.on("close", () => {
      console.log("Files were successfully archived.");
      resolve();
    });

    archive.on("warning", (error) => {
      console.warn(error);
    });

    archive.on("error", (error) => {
      reject(error);
    });

    archive.pipe(output);
    archive.directory("web", false);
    archive.finalize();

    resolve(configObj);
  });
};
