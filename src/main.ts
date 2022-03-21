import express from "express";
import { VK, getRandomId, API } from "vk-io";
import "reflect-metadata";
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  createConnection,
} from "typeorm";

const token = process.env.TOKEN;

const papochka_token = process.env.PAPA_TOKEN;

@Entity()
class Settings {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    length: 20,
    unique: true,
  })
  name: string;
  @Column({
    default: false,
  })
  value: boolean;
}

const getBanEnd = () => new Date().getSeconds() + 86400;
const getManagers = async (
  api: API,
  group_id: string | number
): Promise<number[]> =>
  (
    await api.groups.getMembers({
      group_id: String(group_id),
      filter: "managers",
      count: 100,
      offset: 0,
      sort: "time_desc",
    })
  ).items.map((val: any) => val.id);

const PORT = process.env.PORT || "8080";

const bootstrap = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Settings],
    synchronize: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const settingsRepo = conn.getRepository(Settings);

  const setDefaultScamMode = async (sm: boolean = false) => {
    return await settingsRepo.save(
      settingsRepo.create({ name: "scam_mode", value: sm })
    );
  };
  const getScamMode = async () =>
    (
      (await settingsRepo.findOneBy({ name: "scam_mode" })) ||
      (await setDefaultScamMode())
    ).value;
  const setScamMode = async (sm?: boolean) => {
    const scammode = await settingsRepo.findOneBy({ name: "scam_mode" });
    if (!scammode) return await setDefaultScamMode(sm);
    scammode.value = sm;
    return await settingsRepo.save(scammode);
  };
  const turnScamMode = async () => setScamMode(!(await getScamMode()));

  const app = express();
  const papochkaVk = new VK({ token: papochka_token });
  const vk = new VK({
    token: token,
    webhookSecret: process.env.SECRET_TOKEN,
    webhookConfirmation: process.env.CONFIRM_TOKEN,
    language: "de",
    pollingGroupId: Number(process.env.GROUP_ID),
  });
  const { updates, api } = vk;

  updates
    .on("message_new", async ({ text, peerId, senderId, $groupId }) => {
      if (peerId !== senderId || !$groupId || !text) return;
      const managers = await getManagers(api, Math.abs($groupId));
      if (managers.indexOf(senderId) === -1) return;
      switch (text.toLowerCase()) {
        case "установить скам база":
          await setScamMode(true);
          api.messages.send({
            peer_id: peerId,
            message: "Включен SCAM SPAM режим (БАЗА)",
            random_id: getRandomId(),
          });
          break;

        case "установить скам кринж":
          await setScamMode(false);
          api.messages.send({
            peer_id: peerId,
            message: "Выключен SCAM SPAM режим (КРИНЖ)",
            random_id: getRandomId(),
          });
          break;

        case "переключить скам":
          await turnScamMode();
          api.messages.send({
            peer_id: peerId,
            message: `SCAM SPAM переключен на ${
              (await getScamMode()) ? "БАЗА" : "КРИНЖ"
            }`,
            random_id: getRandomId(),
          });
          break;

        case "получить скам":
          api.messages.send({
            peer_id: peerId,
            message: `SCAM SPAM: ${(await getScamMode()) ? "БАЗА" : "КРИНЖ"}`,
            random_id: getRandomId(),
          });
          break;
      }
    })
    .on("wall_post_new", async ({ wall }) => {
      if (!wall) return;
      const isNotMe = wall.ownerId !== wall.authorId;
      const managers = await getManagers(api, Math.abs(wall.ownerId));
      const isNotAdmin = managers.indexOf(wall.authorId) === -1;
      const iel = isNotMe && (await getScamMode()) && isNotAdmin;
      if (iel) {
        papochkaVk.api.wall.delete({
          owner_id: wall.ownerId,
          post_id: wall.id,
        });
        // papochkaVk.api.groups.ban({
        //   group_id: Math.abs(wall.ownerId),
        //   comment: "ВАС ЗАМЕТИЛИ",
        //   comment_visible: 1,
        //   reason: 1,
        //   end_date: getBanEnd(),
        //   owner_id: wall.authorId,
        // });
      }
    })
    .on(
      [
        "board_comment_new",
        "market_comment_new",
        "photo_comment_new",
        "market_comment_new",
        "video_comment_new",
        "wall_reply_new",
      ],
      async (props) => {
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
        const managers = await getManagers(api, Math.abs(ownerId));
        const isNotAdmin = managers.indexOf(fromId) === -1;
        const isNotMe = ownerId !== fromId;
        const iel = isNotMe && (await getScamMode()) && isNotAdmin;
        if (isBoardComment && iel)
          papochkaVk.api.board.deleteComment({
            comment_id: id,
            group_id: Math.abs(ownerId),
            topic_id: objectId,
          });
        if (isMarketComment && iel)
          papochkaVk.api.market.deleteComment({
            comment_id: id,
            owner_id: ownerId,
          });
        if (isVideoComment && iel)
          papochkaVk.api.video.deleteComment({
            comment_id: id,
            owner_id: ownerId,
          });
        if (isPhotoComment && iel)
          papochkaVk.api.photos.deleteComment({
            comment_id: id,
            owner_id: ownerId,
          });
        if (isWallComment && iel)
          papochkaVk.api.wall.deleteComment({
            comment_id: id,
            owner_id: ownerId,
          });
        // if (iel)
        //   papochkaVk.api.groups.ban({
        //     group_id: Math.abs(ownerId),
        //     comment: "ВАС ЗАМЕТИЛИ",
        //     comment_visible: 1,
        //     reason: 1,
        //     end_date: getBanEnd(),
        //     owner_id: fromId,
        //   });
      }
    );

  app.post("/listening", updates.getWebhookCallback());

  app.listen(PORT, () => {
    console.log(`listen on port ${PORT}`);
  });
};

bootstrap().catch(console.error);
