import { DataSource } from "typeorm";
import { Settings } from "../../settings.entity";

export const getSettingsRepo = (conn: DataSource) =>
  conn.getRepository(Settings);
