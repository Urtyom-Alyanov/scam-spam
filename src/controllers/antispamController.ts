import { Repository } from "typeorm";
import { Controller } from "./conntroller";
import { Settings } from "../settings.entity";
import { getVkFromEnv } from "../utils/getVkFromEnv";
import { eventEmmiter } from "../handlers";
import { getPapochkaVk } from "../utils/getPapochkaVk";

export class AntispamController extends Controller {
  public async setPaths(): Promise<void> {
    const { vk: papochkaVk } = getPapochkaVk();
    getVkFromEnv().forEach(({ vk, c }) => {
      const { updates, api } = vk;
      eventEmmiter(updates, api, this.repo, papochkaVk);
      this.router.post("/" + c.name, updates.getWebhookCallback());
      console.log(
        `[SUCCESS] AntispamController: Route "POST /${c.name}" is loaded`
      );
    });
  }

  constructor(private repo: Repository<Settings>) {
    super();
  }
}
