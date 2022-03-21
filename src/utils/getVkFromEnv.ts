import { VK } from "vk-io";
import { EnvConfig } from "../settings.typ";

export const getVkFromEnv = () => {
  const envConfigs: EnvConfig[] = JSON.parse(process.env.CONFIGS);
  return envConfigs.map((c) => ({
    vk: new VK({
      token: c.token,
      webhookSecret: c.secret,
      webhookConfirmation: c.confirm,
      language: "de",
      pollingGroupId: Number(c.gId),
    }),
    c: c,
  }));
};
