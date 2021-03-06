import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { ScamModeRepositoryCreator } from "./repository";
import path from "path";
import { ConnectController } from "./controllers/connectController";
import { AntispamController } from "./controllers/antispamController";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { ORMCONFIG } from "./ormconfig";
import { getPapochkaVk } from "./utils/getPapochkaVk";
dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const bootstrap = async () => {
  const conn = await createConnection(ORMCONFIG); // Метод устаревший, знаю, но зато работает нормально в отличии от new DataSource(ORMCONFIG);
  const repo = ScamModeRepositoryCreator.getSettingsRepo(conn);

  const app = express();

  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "ejs");
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  app.use("/static", express.static(path.join(__dirname, "..", "public")));
  console.log(`[SUCCESS] AppController: Route "ANY /static" is loaded`);

  console.log(
    `[LOG] AppController: Route "ANY /listening/" is loading to AntispamController`
  );
  app.use("/listening", await new AntispamController(repo).connectRouter());
  console.log(
    `[SUCCESS] AppController: Route "ANY /listening/" is loaded to AntispamController`
  );

  console.log(
    `[LOG] AppController: Route "ANY /connect/" is loading to ConnectController`
  );
  app.use(
    "/connect",
    await new ConnectController(getPapochkaVk().vk).connectRouter()
  );
  console.log(
    `[SUCCESS] AppController: Route "ANY /connect/" is loaded to ConnectController`
  );

  app.listen(PORT, () => {
    console.log(`[LOG] AppController: listening on port ${PORT}`);
  });
};

bootstrap().catch(console.error);
