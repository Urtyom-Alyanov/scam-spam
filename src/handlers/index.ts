import { CommentHandler } from "./comment.handler";
import { WallPostNewHandler } from "./wall-post-new.handler";
import { MessagesNewHandler } from "./messages-new.handler";
import { API, Updates, VK } from "vk-io";
import { Repository } from "typeorm";
import { Settings } from "../settings.entity";

export const eventEmmiter = (
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

export { WallPostNewHandler, MessagesNewHandler, CommentHandler };
