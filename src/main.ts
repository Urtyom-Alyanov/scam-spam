import express from "express";
import { VK, API, Updates } from "vk-io";
import "reflect-metadata";
import { createConnection, Repository } from "typeorm";
import { getVkFromEnv } from "./utils/getVkFromEnv";
import { Settings } from "./settings.entity";
import {
  CommentHandler,
  MessagesNewHandler,
  WallPostNewHandler,
} from "./handlers";
import { ScamModeRepositoryCreator } from "./repository";

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

const PORT = process.env.PORT || "8080";

const bootstrap = async () => {
  const conn = await createConnection({
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
  const papochkaVk = new VK({ token: process.env.PAPA_TOKEN });

  getVkFromEnv().forEach(({ vk, c }) => {
    const { updates, api } = vk;
    eventEmmiter(updates, api, repo, papochkaVk);
    app.post("/listening/" + c.name, updates.getWebhookCallback());
  });

  app.listen(PORT, () => {
    console.log(`listen on port ${PORT}`);
  });
};

bootstrap().catch(console.error);
