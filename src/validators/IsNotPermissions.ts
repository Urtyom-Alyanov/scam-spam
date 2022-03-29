import { CustomValidator } from "express-validator";
import { VK } from "vk-io";

export const IsNotPermissions: CustomValidator = async (val: string) => {
  try {
    const vk = new VK({
      token: val,
    });
    const permissions = await vk.api.account.getAppPermissions({
      user_id: (await vk.api.account.getProfileInfo({})).id,
    });
    if (permissions < 140492254)
      return Promise.reject("Вы феминистка (недостаточно прав)");
    return true;
  } catch (error) {
    return Promise.reject("Токен не валиден");
  }
};
