import { Middleware } from "middleware-io";
import { Repository } from "typeorm";
import { API, ContextDefaultState, VK, WallPostContext } from "vk-io";
import { AllowArray } from "vk-io/lib/types";
import { getScamMode } from "../repository/scam/getScamMode";
import { Settings } from "../settings.entity";
import { getManagers } from "../utils/getManagers";
import { IEventHandler } from "./handler.interface";

export class WallPostNewHandler
  implements IEventHandler<WallPostContext<ContextDefaultState>>
{
  constructor(
    private repo: Repository<Settings>,
    private api: API,
    private papochkaVk: VK
  ) {}

  run: AllowArray<Middleware<WallPostContext<ContextDefaultState>>> = async ({
    wall,
  }) => {
    if (!wall) return;
    const isNotMe = wall.ownerId !== wall.authorId;
    const managers = await getManagers(this.api, Math.abs(wall.ownerId));
    const isNotAdmin = managers.indexOf(wall.authorId) === -1;
    const iel = isNotMe && (await getScamMode(this.repo)) && isNotAdmin;
    if (iel)
      this.papochkaVk.api.wall.delete({
        owner_id: wall.ownerId,
        post_id: wall.id,
      });
  };
}
