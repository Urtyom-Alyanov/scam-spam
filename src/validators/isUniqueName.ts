import { CustomValidator } from "express-validator";
import { getVkFromEnv } from "../utils/getVkFromEnv";

export const isUniqueName: CustomValidator = (val: string) => {
  const vkFromEnv = getVkFromEnv();
  const names = vkFromEnv.map((val) => val.c.name);
  if (names.filter((value) => val === value)[0])
    return Promise.reject("Имя уже присвоено другому объекту");
  return true;
};
