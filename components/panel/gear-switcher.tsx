
import { Hand, Zap, Bot } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export type GEAR_MODE = '手动' | '自动' | 'Agent';

interface GearSwitcherProps {
  gearMode: GEAR_MODE;
  onGearChange: (gear: GEAR_MODE) => void;
  className?: string;
}

const GEAR_OPTIONS: GEAR_MODE[] = ['手动', '自动', 'Agent'];

const getGearIcon = (gear: GEAR_MODE, size: string = 'h-5 w-5') => {
  switch (gear) {
    case '手动':
      return <Hand className={size} />;
    case '自动':
      return <Zap className={size} />;
    case 'Agent':
      return <Bot className={size} />;
    default:
      return <Hand className={size} />;
  }
};

export function GearSwitcher({ gearMode, onGearChange, className = '' }: GearSwitcherProps) {
  const handleGearSelect = (gear: GEAR_MODE) => {
    onGearChange(gear);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-111 cursor-pointer">
            {getGearIcon(gearMode)}
          </div>
        </HoverCardTrigger>
        <HoverCardContent 
          side="top" 
          align="center" 
          sideOffset={8}
          className="w-auto p-0 border-0 bg-white/77 backdrop-blur-md shadow-none"
        >
          <div className="rounded-xl shadow-xl border border-gray-200/50 p-2 space-y-1 min-w-[120px]">
            {GEAR_OPTIONS.map((gear) => (
              <button
                key={gear}
                onClick={() => handleGearSelect(gear)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  gearMode === gear
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5">
                  {getGearIcon(gear, 'h-4 w-4')}
                </div>
                <span>{gear}</span>
              </button>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}