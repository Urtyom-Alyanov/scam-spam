import { CustomValidator } from "express-validator";
import { VK } from "vk-io";

export const IsInvalidToken: CustomValidator = async (val: string) => {
  try {
    const vk = new VK({
      token: val,
    });
    await vk.api.account.getInfo({});
    return true;
  } catch (error) {
    return Promise.reject("Токен не валиден");
  }
};

export const IsInvalidTokenGroup: CustomValidator = async (val: string) => {
  try {
    const vk = new VK({
      token: val,
    });
    await vk.api.groups.getTokenPermissions({});
    return true;
  } catch (error) {
    return Promise.reject("Токен не валиден");
  }
};
