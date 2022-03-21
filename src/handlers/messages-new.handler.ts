import { Middleware } from "middleware-io";
import { Repository } from "typeorm";
import { API, ContextDefaultState, getRandomId, MessageContext } from "vk-io";
import { AllowArray } from "vk-io/lib/types";
import { getScamMode } from "../repository/scam/getScamMode";
import { setScamMode } from "../repository/scam/setScamMode";
import { turnScamMode } from "../repository/scam/turnScamMode";
import { Settings } from "../settings.entity";
import { getManagers } from "../utils/getManagers";
import { EventHandler } from "./handler.interface";

export class MessagesNewHandler
  implements EventHandler<MessageContext<ContextDefaultState>>
{
  constructor(private api: API, private repo: Repository<Settings>) {}

  private async turnScam(peerId: number) {
    await turnScamMode(this.repo);
    this.api.messages.send({
      peer_id: peerId,
      message: `SCAM SPAM переключен на ${
        (await getScamMode(this.repo)) ? "БАЗА" : "КРИНЖ"
      }`,
      random_id: getRandomId(),
    });
  }

  private async setScamCringe(peerId: number) {
    await setScamMode(this.repo, false);
    this.api.messages.send({
      peer_id: peerId,
      message: "Выключен SCAM SPAM режим (КРИНЖ)",
      random_id: getRandomId(),
    });
  }

  private async setScamBased(peerId: number) {
    await setScamMode(this.repo, true);
    this.api.messages.send({
      peer_id: peerId,
      message: "Включен SCAM SPAM режим (БАЗА)",
      random_id: getRandomId(),
    });
  }

  private async getScam(peerId: number) {
    this.api.messages.send({
      peer_id: peerId,
      message: `SCAM SPAM: ${
        (await getScamMode(this.repo)) ? "БАЗА" : "КРИНЖ"
      }`,
      random_id: getRandomId(),
    });
  }

  readonly run: AllowArray<Middleware<MessageContext<ContextDefaultState>>> =
    async ({ text, peerId, senderId, $groupId }) => {
      if (peerId !== senderId || !$groupId || !text) return;
      const managers = await getManagers(this.api, Math.abs($groupId));
      if (managers.indexOf(senderId) === -1) return;
      switch (text.toLowerCase()) {
        case "установить скам база":
          this.setScamBased(peerId);
          break;

        case "установить скам кринж":
          this.setScamCringe(peerId);
          break;

        case "переключить скам":
          this.turnScam(peerId);
          break;

        case "получить скам":
          this.getScam(peerId);
          break;
      }
    };
}
