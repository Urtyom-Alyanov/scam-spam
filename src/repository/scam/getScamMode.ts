import { Repository } from "typeorm";
import { Settings } from "../../settings.entity";
import { setDefaultScamMode } from "./setDefaultScamMode";

export const getScamMode = async (repo: Repository<Settings>) =>
  (
    (await repo.findOneBy({ name: "scam_mode" })) ||
    (await setDefaultScamMode(repo))
  ).value;
