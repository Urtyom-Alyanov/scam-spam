import { API } from "vk-io";

export type Role = "moderator" | "editor" | "administrator" | "creator";

export const getManagers = async (
  api: API,
  group_id: string | number,
  role?: Role[]
): Promise<number[]> =>
  (
    await api.groups.getMembers({
      group_id: String(group_id),
      filter: "managers",
      count: 100,
      offset: 0,
      sort: "time_desc",
    })
  ).items.filter((val: any) => role ? role.includes(val.role) : true).map((val: any) => val.id);
