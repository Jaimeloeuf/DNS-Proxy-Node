"use strict";

const config = require("config.js");

const async = require("async");
const dns = require("native-dns");
const server = dns.createServer();
const proxy = require("./proxy");

const { entries } = require("./db");

server.on("request", function handleRequest(request, response) {
  console.log(
    "request from",
    request.address.address,
    "for",
    request.question[0].name
  );

  const f = []; // array of functions

  // proxy all questions
  // since proxying is asynchronous, store all callbacks
  request.question.forEach((question) => {
    const entry = entries.filter((r) =>
      new RegExp(r.domain, "i").exec(question.name)
    );

    if (entry.length)
      entry[0].records.forEach((record) => {
        record.name = question.name;
        record.ttl = record.ttl || 2592000; // Defaults to block for 1 month

        // Take care of CNAME requests too
        if (record.type == "CNAME") {
          record.data = record.address;
          f.push((cb) =>
            proxy(
              { name: record.data, type: dns.consts.NAME_TO_QTYPE.A, class: 1 },
              response,
              cb
            )
          );
        }

        response.answer.push(dns[record.type](record));
      });
    else f.push((cb) => proxy(question, response, cb));
  });

  // do the proxying in parallel
  // when done, respond to the request by sending the response
  async.parallel(f, function () {
    response.send();
  });
});

server.on("close", () => console.log("server closed", server.address()));
server.on("error", (err, buff, req, res) => console.error(err.stack));
server.on("socketError", (err, socket) => console.error(err));
server.on("listening", () => console.log("Listening to", server.address()));

server.serve(config.port);
