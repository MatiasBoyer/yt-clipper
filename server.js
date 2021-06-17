// ---- NO EDIT ----
const conf = require("./config.js");
const err = require("./errors.js");
const express = require("express");
const short = require("short-uuid");
const bp = require("body-parser");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const readline = require("readline");
const { exec } = require("child_process");

const MongoClient = require("mongodb").MongoClient;
const app = express();
var db_username = "";
var db_password = "";
var MongoCONN = "";

const normalChars =
  "0123456789QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm";
const dl_location = __dirname + "\\tmp";

// -- CODE --

var console = {};
console.log = function (data, toFile = true) {
  if (toFile) {
    var datestr = new Date()
      .toISOString()
      .replace(/T/, " ") // replace T with a space
      .replace(/\..+/, ""); // delete the dot and everything after
    fs.appendFile(
      __dirname + "\\log\\stdout.txt",
      `\n[${datestr}]\n${data}`,
      (err) => {
        if (err) throw err;
      }
    );
  }

  process.stdout.write(data + "\n");
};
console.error = function (data, toFile = true) {
  if (toFile) {
    var datestr = new Date()
      .toISOString()
      .replace(/T/, " ") // replace T with a space
      .replace(/\..+/, ""); // delete the dot and everything after
    fs.appendFile(
      __dirname + "\\log\\stderr.txt",
      `\n[${datestr}]\n${data}`,
      (err) => {
        if (err) throw err;
      }
    );
  }
  process.stderr.write(data + "\n");
};

async function load_dbaccess() {
  const fstream = fs.createReadStream(__dirname + "\\access");
  const rl = readline.createInterface({
    input: fstream,
    crlfDelay: Infinity,
  });

  var data = [];

  for await (const line of rl) {
    data.push(line);
  }

  db_username = data[0];
  db_password = data[1];
  MongoCONN = data[2];

  MongoCONN = MongoCONN.replace("DB-USER", db_username);
  MongoCONN = MongoCONN.replace("DB-PASS", db_password);
}

var db_requests = null;

function update_req(req_id, status, message) {
  db_requests.updateOne(
    { $or: [{ req_id: req_id }] },
    { $set: { req_status: status, message: message } }
  );
}

function dl_vid(req_id, vid_id, from, to) {
  update_req(req_id, 1001, "Started.");
  var yt_dl_cmd = `youtube-dl -f 22/18/best -g \"https://www.youtube.com/watch?v=${vid_id}\"`;

  console.log("Started dl_vid");
  exec(yt_dl_cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      console.log("Error on YT_DL");
      update_req(req_id, 1003, "error on YT_DL");
      return;
    }

    yt_dl_result = stdout.split("\n");
    //console.log(`stderr: ${stderr}`);
    //console.log(`stdout: ${stdout}`);

    var ffmpeg_cmd = `ffmpeg -ss ${from} -i \"${yt_dl_result.join(" ")}\" -t ${
      to - from
    } -c:v copy -c:a aac ${dl_location}\\${req_id}.mp4`;
    exec(ffmpeg_cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        console.log("Error on FFMPEG");
        update_req(req_id, 1003, "error on FFMPEG");
        return;
      }

      //console.log(`stderr: ${stderr}`);
      //console.log(`stdout: ${stdout}`);

      console.log("Ended dl_vid");
      update_req(req_id, 1002, "ended DL_VID");
    });
  });
}

function initMongo() {
  MongoClient.connect(
    MongoCONN,
    { useUnifiedTopology: true },
    (err, client) => {
      if (err) return console.error(err);
      console.log("Connected to MongoDB");

      const limiter = rateLimit({
        windowMs: conf.LIMIT_TIME * 60 * 1000,
        max: conf.LIMIT_CALLS,
        onLimitReached: (req, res, options) => {
          res.status(429);
          res.send({
            message: "Too many requests! Please try again in 15 minutes.",
          });
        },
      });

      app.use(limiter);

      app.use(express.json());
      app.use(express.static("page"));

      app.use(bp.json());
      app.use(bp.urlencoded({ extended: true }));

      const db = client.db("ytclipper");
      db_requests = db.collection("requests");

      function delete_vid(req_id, okCallback, errorCallback) {
        const file = `${__dirname}/tmp/${req_id}.mp4`;
        db_requests
          .findOne({ $or: [{ req_id: req_id }] })
          .then((r) => {
            db_requests.deleteOne({ $or: [{ req_id: req_id }] });

            fs.unlink(file, (err) => {
              if (err) {
                errorCallback(err);
                return;
              }

              okCallback();
            });
          })
          .catch((err) => {
            console.log(err);
            errorCallback(err);
          });
      }

      app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.setHeader("Access-Control-Allow-Credentials", true);
        next();
      });

      app.post("/video/request", (req, res) => {
        try {
          const { vid_id, from, to } = req.body;

          var from_val = parseFloat(from);
          var to_val = parseFloat(to);

          if (vid_id == undefined || from_val == NaN || to_val == NaN) {
            throw err.REQ_UNDEFINED;
          }

          if (vid_id.length > 12) {
            throw err.REQ_ID_LENGTH;
          }

          if (from_val >= to_val) {
            throw err.REQ_FROM_GREATER;
          }

          if (to_val - from_val > conf.MAX_VIDEO_DURATION) {
            throw err.REQ_EXCEEDED_DURATION;
          }

          console.log(`REQUEST: '${vid_id}' ${from}/${to}`);

          var curr = Date.now();
          var reqid = `${parseInt(curr / 1000)}-${short.generate()}`;

          var ip =
            req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;

          db_requests.insertOne({
            req_id: reqid,
            req_ip: ip,
            req_status: 1000,
            date: Date.now(),
            vid_id: vid_id,
            from: from,
            to: to,
            message: "init",
          });

          res.status(200).send({
            message: "ok",
            req_id: reqid,
          });

          dl_vid(reqid, vid_id, from, to);
        } 
        catch (e) 
        { 
          res.status(400);
          res.send({ message: e });
        }
      });

      app.get("/video/status", (req, res) => {
        const { req_id } = req.query;

        //console.log(`query: '${req_id}'`)

        var query = db_requests
          .findOne({ $or: [{ req_id: req_id }] })
          .then((result) => {
            res.status(200);
            res.send({
              message: "ok",
              req_status: result.req_status,
            });
          })
          .catch((err) => {
            res.status(404);
            res.send({
              message: "Video not found!",
              req_status: null
            });
          });
      });

      app.get("/video/download", (req, res) => {
        const { req_id } = req.query;
        const file = `${__dirname}/tmp/${req_id}.mp4`;

        var query = db_requests
          .findOne({ $or: [{ req_id: req_id }] })
          .then((result) => {
            fs.stat(file, (err, stats) => {
              if (err) {
                throw err;
              } else {
                res.status(200);
                res.sendFile(file);
              }
            });
          })
          .catch((err) => {
            res.status(404);
            res.send({
              message: err,
            });
          });
      });

      app.delete("/video/remove", (req, res) => {
        const { req_id } = req.query;

        for (var i = 0; i < req_id.length; i++) {
          if (normalChars.includes(req_id[i])) {
            res.status(400);
            res.send({ message: "string contains special characters!" });
            return;
          }

          delete_vid(
            req_id,
            () => {
              res.status(200);
              res.send({ message: "ok" });
            },
            (err) => {
              res.status(400);
              res.send({ message: err });
            }
          );
        }
      });

      app.get("/video/*", (req, res) => {
        const file = __dirname + req.url.replace("video", "tmp");
        fs.stat(file, (err, stats) => {
          if (err) {
            res.status(400);
            res.send({ message: `${err}` });
            return;
          } else {
            res.status(200);
            res.sendFile(file);
          }
        });
      });

      app.get("/debug", (req, res) => {
        const { type } = req.query;
        switch (type) {
          case "stdout":
            res.status(200);
            res.sendFile(`${__dirname}\\log\\stdout.txt`);
            break;
          case "stderr":
            res.status(200);
            res.sendFile(`${__dirname}\\log\\stderr.txt`);
            break;
        }
      });

      app.get("/", (req, res) => {
        res.sendFile("page/index.html", { root: __dirname });
      });

      app.listen(conf.PORT, () => console.log(`Started on port ${conf.PORT}`));

      setInterval(() => {
        db_requests
          .find({ date: { $lt: Date.now() - conf.ADEL_OLDER_THAN * 60 } })
          .toArray()
          .then((result) => {
            result.forEach((element) => {
              delete_vid(
                element["req_id"],
                () => {
                  console.log(`[TASK] Deleted ${element["req_id"]}`);
                },
                (err) => {
                  console.log(`Error deleting ${element["req_id"]} - ${err}`);
                }
              );
            });
          });
      }, conf.ADEL_EVERY_MINS * 60000);
    }
  );
}

load_dbaccess();
setTimeout(() => initMongo(), 500);
