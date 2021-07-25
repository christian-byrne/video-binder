/**
 * @author Christian P. Byrne
 */
import { model, Schema, connect, Model } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";

type Credentials = {
  username: string;
  password: string;
};

type Video = {
  title: String;
  originalPath: String;
  tags: string[];
  setting?: string;
  genre?: string;
  artist: string;
  audioFile: string;
  duration: number;

  // or age restriction
  year?: string;
  // or technique
  movement?: string;
  // or pos
  category?: string;
  // or am
  production?: string;
  // or hands
  credits?: string;
  // or studio
  creator?: string;
  // or intensity
  contentWarning?: string;
  // or pname
  contributors?: string;
};

type Playlist = {
  name: string;
  tags?: string[];
  items: string[];
};

interface Database {
  videoSchema: Schema<Video, Model<any, any, any>, undefined, any>;
  videoModel: Model<Video, {}, {}>;

  playlistSchema: Schema<Playlist, Model<any, any, any>, undefined, any>;
  playlistModel: Model<Playlist, {}, {}>;
}

interface MongoDatabase {
  name: string;
  port: number;
  modelNames?: string[];
  models?: Schema[];
}

interface ExpressServer {
  server: express.Express;
  bindMiddleware: (middleware: any[]) => void;
}

// ────────────────────────────────────────────────────────────────────────────────

class Database {
  constructor() {
    this.videoSchema = new Schema<Video>({
      title: String,
      originalPath: String,
      year: { type: String, required: false },
      movement: { type: String, required: false },
      category: { type: String, required: false },
      production: { type: String, required: false },
      credits: { type: String, required: false },
      creator: { type: String, required: false },
      contentWarning: { type: String, required: false },
      contributors: { type: String, required: false },
      setting: { type: String, required: false },
      genre: { type: String, required: false },
      artist: String,
      tags: [String],
      audioFile: String,
      duration: Number,
    });
    this.videoModel = model<Video>("item", this.videoSchema);
  }
}

class ExpressServer {
  constructor(staticFolder = "public_html") {
    this.server = express();
    this.server.use(express.static(staticFolder));
    this.server.use(express.json());
    this.server.get("/", (req: Request) => {
      if (!__prod__) {
        console.dir(req);
      }
    });
  }
  bindMiddleware = (middlewareArray: any[]) => {
    for (const handler of middlewareArray) {
      this.server.use(handler);
    }
  };
}

interface App extends ExpressServer, MongoDatabase, Database {
  PORT: number;
  IP: string;
  IMGFOLDER: string;
  GAP: string;
  SPACER: (title: string) => void;

  dbConfig: MongoDatabase;
  db: Database;

  upload: multer.Multer;

  middleware: any[];
  http: ExpressServer;
}

class App {
  constructor() {
    this.PORT = __prod__ ? 80 : 5000;
    this.IP = __prod__ ? "143.198.57.139" : "127.0.0.1";
    this.IMGFOLDER = `${__dirname}/../public_html/media`;
    this.GAP = "\n\n\n\n";
    this.SPACER = (title = "section break") =>
      console.log(`${this.GAP}___ ${title} ___ ${this.GAP}`);

    // 1. Construct database client with configuration options.
    this.dbConfig = {
      name: "binder2",
      port: 27017,
      modelNames: ["videos"],
    };
    connect(`mongodb://localhost:${this.dbConfig.port}/${this.dbConfig.name}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((value: typeof import("mongoose")) => {
      if (!__prod__) {
        this.SPACER("Mongoose Client Constructed");
        console.dir(value);
      }
    });

    // 2. Construct Resolvers and Models instance.
    this.db = new Database();

    // 3. Initialize server and bind middleware.
    this.upload = multer({
      dest: `${this.IMGFOLDER}`,
    });
    this.http = new ExpressServer();
    this.middleware = [cors(), json(), urlencoded({ extended: true })];
    this.http.bindMiddleware(this.middleware);

    // 4. Bind routers.
    // TODO: routers setter method efficient?

    this.http.server.post(
      "/upload",
      this.upload.single("audioFile"),
      (req: Request, res: Response) => {
        let path = "";
        if (req.file) {
          path = req.file.filename ? req.file.filename : "";
        }

        let mutation = new this.db.videoModel();
        const fields = [
          "title",
          "originalPath",
          "tags",
          "setting",
          "genre",
          "artist",
          "audioFile",
          "duration",
          "year",
          "movement",
          "category",
          "production",
          "credits",
          "creator",
          "contentWarning",
          "contributors",
        ];

        Object.assign(mutation, req.body);
        mutation.originalPath = path;

        mutation.save().then(() => {
          res.end();
        });
      }
    );

    this.http.server.post("/search", (req: Request, res: Response) => {
      this.db.videoModel.find({}).then((queryResult: Video[]) => {
        console.log(queryResult);
        res.json(
          queryResult.filter((vid) => {
            let match = true;
            for (const [field, value] of Object.entries(req.body)) {
              if (vid[field] && !vid[field].includes(value)) {
                match = false;
              }
              if (match) {
                return vid;
              }
            }
          })
        );
      });
    });

    /**
     * Response: (Boolean) true if successul login, false if user doesn't exist.
     *
     */
    // this.http.server.post("/login", (req: Request, res: Response) => {

    //   this.db.queries.findAll.user().then((users: User[]) => {
    //     if (!__prod__) {
    //       this.SPACER(
    //         `Credentials attempted - Username : ${req.body.username} Password ${req.body.password}`
    //       );
    //     }
    //     let matches: User[] | null = users.filter(
    //       (usr) =>
    //         usr.username == req.body.username &&
    //         usr.password == req.body.password
    //     );
    //     if (matches.length > 0) {
    //       res.send(true);
    //     } else {
    //       res.send(false);
    //     }
    //   });
    // });

    // 5. Construct HTTP server client.
    this.http.server.listen(this.PORT, () => {
      if (!__prod__) {
        this.SPACER(`Listening at ${this.IP} on port ${this.PORT}.`);
      }
    });
  }
}

const x = new App();
