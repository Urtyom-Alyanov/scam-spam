import { Middleware } from "middleware-io";
import { Repository } from "typeorm";
import { API, CommentContext, ContextDefaultState, VK } from "vk-io";
import { AllowArray } from "vk-io/lib/types";
import { getScamMode } from "../repository/scam/getScamMode";
import { Settings } from "../settings.entity";
import { getManagers } from "../utils/getManagers";
import { IEventHandler } from "./handler.interface";

export class CommentHandler
  implements IEventHandler<CommentContext<ContextDefaultState>>
{
  constructor(
    private repo: Repository<Settings>,
    private api: API,
    private papochkaVk: VK
  ) {}

  run: AllowArray<Middleware<CommentContext<ContextDefaultState>>> = async (
    props
  ) => {
    const {
      fromId,
      id,
      isWallComment,
      objectId,
      isBoardComment,
      isMarketComment,
      isVideoComment,
      isPhotoComment,
      ownerId,
    } = props;
    if (!fromId || !ownerId) return;
    const managers = await getManagers(this.api, Math.abs(ownerId));
    const isNotAdmin = managers.indexOf(fromId) === -1;
    const isNotMe = ownerId !== fromId;
    const iel = isNotMe && (await getScamMode(this.repo)) && isNotAdmin;
    if (isBoardComment && iel)
      this.papochkaVk.api.board.deleteComment({
        comment_id: id,
        group_id: Math.abs(ownerId),
        topic_id: objectId,
      });
    if (isMarketComment && iel)
      this.papochkaVk.api.market.deleteComment({
        comment_id: id,
        owner_id: ownerId,
      });
    if (isVideoComment && iel)
      this.papochkaVk.api.video.deleteComment({
        comment_id: id,
        owner_id: ownerId,
      });
    if (isPhotoComment && iel)
      this.papochkaVk.api.photos.deleteComment({
        comment_id: id,
        owner_id: ownerId,
      });
    if (isWallComment && iel)
      this.papochkaVk.api.wall.deleteComment({
        comment_id: id,
        owner_id: ownerId,
      });
  };
}
