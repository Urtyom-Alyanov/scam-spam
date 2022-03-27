import { DataSourceOptions } from "typeorm";
// import path from "path";
import { Settings } from "./settings.entity";

export const ORMCONFIG: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Settings],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
  },
};
