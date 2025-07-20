import { ToolButton } from "@/components/panel/tool-button";
import { Bot, Drone } from "lucide-react";

export { SkuAgentBoard } from "./skuFetchAgent";
export { skuProcessBoard, skuProcessStore } from "./skuProcessBoard";
export { SkuProcessExample } from "./skuProcessExample";

export const AgentButton = ()=>(
<ToolButton 
    icon={<Drone className="size-5" />}
    label="Agent"
    onClick={()=>1}
/>)

