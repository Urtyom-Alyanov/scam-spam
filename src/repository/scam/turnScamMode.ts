import { Repository } from "typeorm";
import { Settings } from "../../settings.entity";
import { getScamMode } from "./getScamMode";
import { setScamMode } from "./setScamMode";

export const turnScamMode = async (repo: Repository<Settings>) =>
  setScamMode(repo, !(await getScamMode(repo)));
