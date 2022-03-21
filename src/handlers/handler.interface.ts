import { AllowArray } from "vk-io/lib/types";
import { Middleware } from "middleware-io";

export interface IEventHandler<ContextT> {
  readonly run: AllowArray<Middleware<ContextT>>;
}
