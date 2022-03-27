import express from "express";
import { VK, API, Updates, getRandomId } from "vk-io";
import "reflect-metadata";
import { DataSource, Repository } from "typeorm";
import { getVkFromEnv } from "./utils/getVkFromEnv";
import { Settings } from "./settings.entity";
import {
  CommentHandler,
  MessagesNewHandler,
  WallPostNewHandler,
} from "./handlers";
import { ScamModeRepositoryCreator } from "./repository";
import path from "path";
import { validationResult, check, ValidationError } from "express-validator";
import { isUniqueGID } from "./validators/isUniqueGID";
import { isUniqueName } from "./validators/isUniqueName";
import { isUniqueGToken } from "./validators/isUniqueGToken";
import {
  IsInvalidToken,
  IsInvalidTokenGroup,
} from "./validators/isInvalidToken";
import { ConnectController } from "./controllers/connectController";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

const eventEmmiter = (
  updates: Updates,
  api: API,
  repo: Repository<Settings>,
  papochkaVk: VK
) =>
  updates
    .on("message_new", new MessagesNewHandler(api, repo).run)
    .on("wall_post_new", new WallPostNewHandler(repo, api, papochkaVk).run)
    .on(
      [
        "board_comment_new",
        "market_comment_new",
        "photo_comment_new",
        "market_comment_new",
        "video_comment_new",
        "wall_reply_new",
      ],
      new CommentHandler(repo, api, papochkaVk).run
    );

const PORT = Number(process.env.PORT) || 8080;

const bootstrap = async () => {
  const conn = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Settings],
    synchronize: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const repo = ScamModeRepositoryCreator.getSettingsRepo(conn);

  const app = express();
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "ejs");
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  const papochkaVk = new VK({ token: process.env.PAPA_TOKEN });

  getVkFromEnv().forEach(({ vk, c }) => {
    const { updates, api } = vk;
    eventEmmiter(updates, api, repo, papochkaVk);
    app.post("/listening/" + c.name, updates.getWebhookCallback());
    console.log(
      `[SUCCESS] AppController: Route "POST /listening/${c.name}" is loaded`
    );
  });
  app.use("/static", express.static(path.join(__dirname, "..", "public")));
  console.log(`[SUCCESS] AppController: Route "ANY /static" is loaded`);
  console.log(
    `[LOG] AppController: Route "ANY /connect/" is loading to ConnectController`
  );
  app.use("/connect", await new ConnectController().connectRouter());
  console.log(
    `[SUCCESS] AppController: Route "ANY /connect/" is loaded to ConnectController`
  );

  app.listen(PORT, () => {
    console.log(`[LOG] AppController: listening on port ${PORT}`);
  });
};

bootstrap().catch(console.error);
