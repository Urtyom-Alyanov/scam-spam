import { Repository } from "typeorm";
import { Settings } from "../../settings.entity";
import { setDefaultScamMode } from "./setDefaultScamMode";

export const setScamMode = async (
  repo: Repository<Settings>,
  mode: boolean
) => {
  const scammode = await repo.findOneBy({ name: "scam_mode" });
  if (!scammode) return await setDefaultScamMode(repo, mode);
  scammode.value = mode;
  return await repo.save(scammode);
};
