import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface PriceRangeFilterProps {
  items: any[];
  priceUnit?: number;
  minPrice: number;
  maxPrice: number;
  onRangeChange: (min: number, max: number) => void;
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  items,
  priceUnit = 10,
  minPrice,
  maxPrice,
  onRangeChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [containerWidth, setContainerWidth] = useState(280);

  // 计算价格分组数据
  const priceGroups = React.useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const groups: { [key: number]: number } = {};
    const maxItemPrice = Math.max(...items.map(item => item.marketPrice / 100));
    const groupCount = Math.ceil(200 / priceUnit); // 只计算到200的分组
    
    // 初始化所有分组（包括200+的特殊组）
    for (let i = 0; i <= groupCount; i++) {
      groups[i * priceUnit] = 0;
    }
    groups[200] = 0; // 200+的特殊组
    
    // 统计每个价格段的商品数量
    items.forEach(item => {
      const price = item.marketPrice / 100;
      let groupKey;
      if (price > 200) {
        groupKey = 200; // 所有大于200的归为200组
      } else {
        groupKey = Math.floor(price / priceUnit) * priceUnit;
      }
      groups[groupKey] = (groups[groupKey] || 0) + 1;
    });
    
    return Object.entries(groups)
      .map(([price, count]) => ({ price: Number(price), count }))
      .sort((a, b) => a.price - b.price);
  }, [items, priceUnit]);

  const maxCount = Math.max(...priceGroups.map(g => g.count), 1);
  const totalPriceRange = Math.max(...priceGroups.map(g => g.price)) || 100;

  // SVG 尺寸
  const width = containerWidth;
  const height = 80;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding;

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 生成路径数据
  const pathData = React.useMemo(() => {
    if (priceGroups.length === 0) return '';
    
    const points = priceGroups.map((group, index) => {
      const x = padding + (group.price / totalPriceRange) * chartWidth;
      const y = height - padding - (group.count / maxCount) * chartHeight;
      return `${x},${y}`;
    });
    
    // 创建平滑曲线
    let path = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      const [prevX, prevY] = points[i - 1].split(',').map(Number);
      const [currX, currY] = points[i].split(',').map(Number);
      const cpX = prevX + (currX - prevX) * 0.5;
      path += ` Q ${cpX},${prevY} ${currX},${currY}`;
    }
    
    // 闭合路径形成面积
    const lastPoint = points[points.length - 1].split(',');
    path += ` L ${lastPoint[0]},${height - padding} L ${padding},${height - padding} Z`;
    
    return path;
  }, [priceGroups, totalPriceRange, maxCount, chartWidth, chartHeight, height, padding]);

  // 计算垂线位置
  const minLineX = padding + (localMinPrice / totalPriceRange) * chartWidth;
  const maxLineX = padding + (localMaxPrice / totalPriceRange) * chartWidth;

  // 处理拖拽
  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = Math.max(padding, Math.min(x, width - padding));
    const price = ((relativeX - padding) / chartWidth) * totalPriceRange;
    
    if (isDragging === 'min') {
      const newMin = Math.max(0, Math.min(price, localMaxPrice - priceUnit));
      setLocalMinPrice(newMin);
      onRangeChange(newMin, localMaxPrice);
    } else if (isDragging === 'max') {
      const newMax = Math.min(totalPriceRange, Math.max(price, localMinPrice + priceUnit));
      setLocalMaxPrice(newMax);
      onRangeChange(localMinPrice, newMax);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          价格范围
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>¥</span>
          <input
            type="number"
            value={Math.round(localMinPrice)}
            onChange={(e) => {
              const newMin = Math.max(0, Math.min(Number(e.target.value), localMaxPrice - priceUnit));
              setLocalMinPrice(newMin);
              onRangeChange(newMin, localMaxPrice);
            }}
            className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#786DF6]"
          />
          <span>-</span>
          <span>¥</span>
          <input
            type="number"
            value={Math.round(localMaxPrice)}
            onChange={(e) => {
              const newMax = Math.min(totalPriceRange, Math.max(Number(e.target.value), localMinPrice + priceUnit));
              setLocalMaxPrice(newMax);
              onRangeChange(localMinPrice, newMax);
            }}
            className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#786DF6]"
          />
        </div>
      </div>
      
      <div className="relative" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 背景网格 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#786DF6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#786DF6" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#786DF6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#786DF6" stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          
          {/* 背景 */}
          <rect width={width} height={height} fill="url(#grid)"/>
          
          {/* 完整面积图 */}
          <path d={pathData} fill="url(#areaGradient)" stroke="#786DF6" strokeWidth="1" opacity="0.3"/>
          
          {/* 选中区域的面积图 */}
          <defs>
            <clipPath id="selectedArea">
              <rect x={minLineX} y={0} width={maxLineX - minLineX} height={height}/>
            </clipPath>
          </defs>
          <path 
            d={pathData} 
            fill="url(#selectedGradient)" 
            stroke="#786DF6" 
            strokeWidth="2" 
            clipPath="url(#selectedArea)"
          />
          
          {/* 最小价格垂线 */}
          <line
            x1={minLineX}
            y1={padding}
            x2={minLineX}
            y2={height - padding}
            stroke="#786DF6"
            strokeWidth="2"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('min')}
          />
          <circle
            cx={minLineX}
            cy={height - padding / 2}
            r="4"
            fill="#786DF6"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('min')}
          />
          
          {/* 最大价格垂线 */}
          <line
            x1={maxLineX}
            y1={padding}
            x2={maxLineX}
            y2={height - padding}
            stroke="#786DF6"
            strokeWidth="2"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('max')}
          />
          <circle
            cx={maxLineX}
            cy={height - padding / 2}
            r="4"
            fill="#786DF6"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('max')}
          />
          
          {/* X轴标签 */}
          {priceGroups.filter((_, i) => i % Math.ceil(priceGroups.length / 5) === 0).map((group) => {
            const x = padding + (group.price / totalPriceRange) * chartWidth;
            return (
              <text
                key={group.price}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                ¥{group.price}
              </text>
            );
          })}
        </svg>
        
        {/* 价格标签 */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>最低价格</span>
          <span>最高价格</span>
        </div>
      </div>
    </div>
  );
};