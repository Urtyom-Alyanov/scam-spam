import { Middleware } from "middleware-io";
import { Repository } from "typeorm";
import { API, ContextDefaultState, getRandomId, MessageContext } from "vk-io";
import { AllowArray } from "vk-io/lib/types";
import { getScamMode } from "../repository/scam/getScamMode";
import { setScamMode } from "../repository/scam/setScamMode";
import { turnScamMode } from "../repository/scam/turnScamMode";
import { Settings } from "../settings.entity";
import { getManagers } from "../utils/getManagers";
import { getVkFromEnv } from "../utils/getVkFromEnv";
import { IEventHandler } from "./handler.interface";

export class MessagesNewHandler
  implements IEventHandler<MessageContext<ContextDefaultState>>
{
  constructor(private api: API, private repo: Repository<Settings>) {}

  private async notifyMembers(senderId: number, groupId: number) {
    const resp = await this.api.users.get({ user_ids: [senderId] });
    const user: {
      id: number;
      first_name: string;
      last_name: string;
      can_access_closed: boolean;
      is_closed: boolean;
    } = resp[0];

    const { c: groupConnInfo } = getVkFromEnv().filter(
      ({ c }) => c.gId === groupId
    )[0];

    getVkFromEnv().forEach(async ({ vk, c }) => {
      const managers = await getManagers(vk.api, c.gId);
      const managersBezId = managers.map((c) => {
        if (c !== senderId) return c;
      });

      managersBezId.forEach(async (id) =>
        vk.api.messages.send({
          peer_id: id,
          message: `SCAM SPAM переключен на ${
            (await getScamMode(this.repo)) ? "БАЗА" : "КРИНЖ"
          }. Инициатор - ${user.first_name} ${
            user.last_name
          } из региона [club${groupId}|${groupConnInfo.name}]`,
          random_id: getRandomId(),
        })
      );
    });
  }

  private async getRegions(peerId: number) {
    const regs = getVkFromEnv().map(({ c }) => `[club${c.gId}|${c.name}]`);
    const string = regs.join("\n");

    this.api.messages.send({
      peer_id: peerId,
      random_id: getRandomId(),
      message: `SCAM SPAN работает в данных регионах: \n\n${string}`,
    });
  }

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
          this.notifyMembers(senderId, $groupId);
          break;

        case "установить скам кринж":
          this.setScamCringe(peerId);
          this.notifyMembers(senderId, $groupId);
          break;

        case "переключить скам":
          this.turnScam(peerId);
          this.notifyMembers(senderId, $groupId);
          break;

        case "получить скам":
          this.getScam(peerId);
          break;

        case "регионы":
          this.getRegions(peerId);
          break;
      }
    };
}
