import { CustomValidator } from "express-validator";
import { getVkFromEnv } from "../utils/getVkFromEnv";

export const isUniqueGID: CustomValidator = (val: number) => {
  const vkFromEnv = getVkFromEnv();
  const ids = vkFromEnv.map((val) => val.c.gId);
  if (ids.filter((id) => val === id)[0])
    return Promise.reject("Группа уже подключена");
  return true;
};
