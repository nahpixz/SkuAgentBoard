import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

// 创建一个工具按钮组件来减少重复代码
interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'primary' | 'danger' | 'default';
}

export const ToolButton = ({ icon, label, onClick, active = false, variant = 'default' }: ToolButtonProps) => {
  // 根据variant设置不同的颜色
  const getIconColor = () => {
    if (active) return 'text-[#786DF6]';
    switch (variant) {
      case 'primary': return 'text-[#786DF6]';
      case 'danger': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center justify-center h-10 w-10 rounded-full ${active ? 'bg-[#786DF6]/10' : 'hover:bg-gray-100'}`}
          onClick={onClick}
        >
          <div className={getIconColor()}>
            {icon}
          </div>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="p-2 w-full text-xs text-white border-none bg-black/70 rounded-md z-55">
        {label}
      </HoverCardContent>
    </HoverCard>
  );
};
