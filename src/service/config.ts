import service from "@/utils/request";

export function getConfiguration(params: object): Promise<EmptyObjectType> {
  return service.get("/index/config", {
    params,
  });
}
