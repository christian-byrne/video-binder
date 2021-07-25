/**
 * Server for ostaa app backend.
 * @author Christian P. Byrne
 */
import { model, Schema, connect } from "mongoose";
import { json, urlencoded } from "body-parser";
import express from "express";
import cors from "cors";
import multer from "multer";
const __prod__ = process.env.NODE_ENV === "production"

/**
 * Database class for mongoose db client with items and users.
 * 
 * @extends  Schema
 * 
 * @description Static db methods:
 * @property {object}   mutations.modify
 * @property {object}   mutations.create
 * @property {object}   queries.findOne
 * @property {object}   queries.findAll
 * 
 */
class EbayDatabase {
  constructor() {
    this.itemSchema = new Schema({
      title: String,
      description: String,
      image: String,
      price: Number,
      stat: String,
    });
    this.userSchema = new Schema({
      username: { type: String, required: true },
      password: { type: String, required: true },
      listings: [String],
      purchases: [String],
    });
    this.itemModel = model("item", this.itemSchema);
    this.userModel = model("user", this.userSchema);

    this.mutations = {
      // NOTE: custom interfaces only helpful for typescript debugging.
      //       But seems better to just use the api as much as possible?.
      create: {
          /** 
           * Create a new user.
           * @param   {{username: string, password: string}} credentials
           * @returns {Promise<void>} 
           */
        user: async (credentials) => {
          const mutation = new this.userModel({
            username: credentials.username,
            password: credentials.password,
            listing: ["none"],
            purchases: ["none"],
          });
          await mutation.save();
        },
        /** Create a new listing.
         * @param   {string}        item
         * @param   {string | null} imgPath
         * @param   {string}        username
         * @returns {Promise<void>} 
         */
        item: async (item, imgPath, username) => {
          const mutation = new this.itemModel({
            title: item.title,
            description: item.description,
            price: item.price,
            stat: "sale",
          });
          if (imgPath) {
            mutation.image = imgPath;
          }
          await mutation.save();
          const user = await this.userModel
            .findOne({ username: username })
            .exec();
          if (user) {
            user.listings.push(mutation._id);
            await user.save();
          }
        },
      },
      modify: {
          /** 
           * Purchase an item. Add item to buyer's purchases array.
           * @param {string}            id     - DB _id value.
           * @param {string}            user   - Username.
           * @returns {Promise<void>} 
           */
        item: async (id, user) => {
          return await this.itemModel.findOne({ _id: id }).then((item) => {
            if (item) {
              item.stat = "sold";
              item.save().then(() => {
                this.userModel.findOne({ username: user }).then((userDoc) => {
                  if (userDoc) {
                    userDoc.purchases.push(id);
                    userDoc.save();
                  }
                });
              });
            }
          });
        },
      },
    };
    this.queries = {
      findOne: {
          /** Find one user searching by username. 
           * @returns {Promise<User | null>} */
        user: async (user) => {
          return await this.userModel.findOne({ username: user }).exec();
        },
      },
      findAll: {
          /** Get all users. @returns {Promise<User[] | null>} */
        user: async () => {
          return await this.userModel.find({}).exec();
        },
        /** Get all items. @returns {Promise<Item[] | null>} */
        item: async () => {
          return await this.itemModel.find({}).exec();
        },
      },
    };
  }
}

/** Construct Express Application.
 * @param {string} [staticFolder="public_html"]
 */
class ExpressServer {
  constructor(staticFolder = "public_html") {
    this.bindMiddleware = (middlewareArray) => {
      for (const handler of middlewareArray) {
        this.server.use(handler);
      }
    };
    this.server = express();
    this.server.use(express.static(staticFolder));
  }
}

/** Ostaa application. @class */
const ostaa = () => {
  const PORT = __prod__ ? 80 : 5000;
  const IP = __prod__ ? "143.198.57.139" : "127.0.0.1";
  const IMGFOLDER = `${__dirname}/../public_html/img`;
  const dbConfig = {
    name: "ostaa",
    port: 27017,
  };

  connect(`mongodb://localhost:${dbConfig.port}/${dbConfig.name}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).catch((reason) => console.log(reason));

  const db = new EbayDatabase();
  const upload = multer({
    dest: `${IMGFOLDER}`,
  });

  const http = new ExpressServer();
  http.bindMiddleware(
    express.json(),
    cors(),
    json(),
    urlencoded({ extended: true })
  );

  http.server.get("/get/:collection/:username", (req, res) => {
    db.queries.findOne.user(req.params.username).then((value) => {
      if (value) {
        let reference;
        if (req.params.collection == "listings") {
          reference = value.listings;
        } else if (req.params.collection == "purchases") {
          reference = value.purchases;
        }
        db.queries.findAll.item().then((items) => {
          res.json(items.filter((i) => reference.includes(i._id)));
        });
      } else {
        res.send("Cannot find user.");
      }
    });
  });

  http.server.get("/buy/:id/:user", (req, res) => {
    db.mutations.modify.item(req.params.id, req.params.user).then(res.end());
  });

  http.server.get("/search/:collection/:keyword", (req, res) => {
    if (req.params.collection == "users") {
      db.queries.findAll.user().then((users) => {
        res.json(
          users.filter(
            (usr) => usr.username && usr.username.includes(req.params.keyword)
          )
        );
      });
    }
    if (req.params.collection == "items") {
      db.queries.findAll.item().then((items) => {
        res.json(
          items.filter(
            (item) =>
              item.description && item.description.includes(req.params.keyword)
          )
        );
      });
    }
  });

  http.server.post(
    "/add/item/:username",
    upload.single("image"),
    (req, res) => {
      let path = "";
      if (req.file) {
        path = req.file.filename ? req.file.filename : "";
      }
      db.mutations.create
        .item(req.body, path, req.params.username)
        .then((value) => {
          res.end();
        });
    }
  );

  http.server.post("/register", (req, res) => {
    db.queries.findAll.user().then((users) => {
      let alreadyExist = users.filter(
        (usr) =>
          usr.username === req.body.username &&
          usr.password === req.body.password
      );
      if (alreadyExist.length > 0) {
        res.send(false);
        return
      }
      db.mutations.create
        .user({
          username: req.body.username,
          password: req.body.password,
        })
        .then(() => {
          res.send(true);
        })
        .catch(() => {
          res.end();
        });
    });
  });

  http.server.post("/login", (req, res) => {
    db.queries.findAll.user().then((users) => {
      let matches = users.filter(
        (usr) =>
          usr.username == req.body.username && usr.password == req.body.password
      );
      if (matches.length > 0) {
        res.send(true);
      } else {
        res.send(false);
      }
    });
  });

  http.server.listen(PORT, () => {});
};

ostaa();
//# sourceMappingURL=server.js.map
