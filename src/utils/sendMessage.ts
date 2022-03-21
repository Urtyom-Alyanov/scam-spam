import { API, getRandomId } from "vk-io";

export const sendMessage = (api: API, peer_id: number, message: string) =>
  api.messages.send({
    peer_id,
    message,
    random_id: getRandomId(),
  });
