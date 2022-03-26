import { CustomValidator } from "express-validator";
import { getVkFromEnv } from "../utils/getVkFromEnv";

export const isUniqueGToken: CustomValidator = (val: string) => {
  const vkFromEnv = getVkFromEnv();
  const tokens = vkFromEnv.map((val) => val.c.token);
  if (tokens.filter((token) => val === token)[0])
    return Promise.reject("Такой токен уже используется");
  return true;
};
