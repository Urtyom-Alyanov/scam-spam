import { Repository } from "typeorm";
import { Settings } from "../../settings.entity";

export const setDefaultScamMode = async (
  repo: Repository<Settings>,
  sm: boolean = false
) => {
  return await repo.save(repo.create({ name: "scam_mode", value: sm }));
};
