import { ToolButton } from "@/components/panel/tool-button";
import { Bot, Drone } from "lucide-react";
import { SkuAgentBoard } from "./skuFetchAgent";

export const AgentButton = ()=>(
<ToolButton 
    icon={<Drone className="size-5" />}
    label="Agent"
    onClick={()=>1}
/>)

export { SkuAgentBoard };
