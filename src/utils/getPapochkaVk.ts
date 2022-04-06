import { VK } from "vk-io";

export const getPapochkaVk = () => {
  const token = process.env["PAPA_TOKEN"];
  const vk = new VK({ token });
  return {
    token,
    vk,
  };
};
