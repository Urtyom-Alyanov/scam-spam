import { NextFunction, Router, Request, Response } from "express";

export interface IController {
  router: Router;
  setPaths(): void | Promise<void>;
  connectRouter(): Promise<
    (req: Request, res: Response, next: NextFunction) => void
  >;
}

export class Controller implements IController {
  router: Router = Router();
  public async connectRouter(): Promise<
    (req: Request, res: Response, next: NextFunction) => void
  > {
    await this.setPaths();
    return (req: Request, res: Response, next: NextFunction) =>
      this.router(req, res, next);
  }
  public async setPaths(): Promise<void> {}
}
