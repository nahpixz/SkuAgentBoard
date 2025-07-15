import { useSettingsStore } from "@/components/panel/settings-store";
import { C2C_LIST } from "@/entrypoints/panel/api";
import { getInspectedUrl, JumpToComplete, ListenKey, waitForRequest } from "@/entrypoints/panel/tasks";
import { skuAgentStore } from "./components/skuFetchAgent";
import { ScrollToEnd_bilimall } from "./opts";

export async function skuAutoScroll(){
  const autoCaptureMall = useSettingsStore.getState().getAndOpen_AutoCaptureMall() //缓存旧autoCaptureMall
  const url = await getInspectedUrl();
  
  console.log('url',url)
  
  if(!url?.startsWith(C2C_LIST.HTML_URL)){
    ListenKey.C2C_LIST = "skuAgentLoadPage";
    const pending = waitForRequest(C2C_LIST.URL,ListenKey.C2C_LIST);
    await JumpToComplete(C2C_LIST.HTML_URL);
    const data = await pending;
    skuAgentStore.getState().stepCount(data.length);
  }

  while (skuAgentStore.getState().running) {
    ListenKey.C2C_LIST = "skuAgentAutoScroll";
    const pending = waitForRequest(C2C_LIST.URL,ListenKey.C2C_LIST);
    await ScrollToEnd_bilimall();
    const data = await pending;
    skuAgentStore.getState().stepCount(data.length);
  }
    
  ListenKey.C2C_LIST = "null";
  useSettingsStore.setState({autoCaptureMall}) // revert autoCaptureMall
}