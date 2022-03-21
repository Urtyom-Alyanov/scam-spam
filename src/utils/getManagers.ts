import { API } from "vk-io";

export const getManagers = async (
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
