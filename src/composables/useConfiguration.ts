import { getConfiguration } from "@/service/config";

export default function useConfiguration() {
  const store = useStore();
  const state = reactive({
    configuration: <EmptyObjectType>{},
    localVersion: 1,
    loading: false,
  });
  const getConfig = async () => {
    try {
      state.loading = true;
      const response = await getConfiguration({});
      state.configuration = response.data;
      store.configuration = response.data;
    } catch (e) {
      console.log(e);
    } finally {
      state.loading = false;
    }
  };
  return {
    getConfig,
  };
}
