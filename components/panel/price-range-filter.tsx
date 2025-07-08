import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface PriceRangeFilterProps {
  items: any[];
  priceUnit?: number;
  minPrice: number;
  maxPrice: number;
  onRangeChange: (min: number, max: number) => void;
}
const groupGrowPrice = 250;
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
  
  const maxItemPrice = React.useMemo(()=>Math.max(...items.map(item => item.marketPrice / 100)),[items]);
  // 计算价格分组数据
  const priceGroups = React.useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const groups: { [key: number]: number } = {};
    
    
    // 小于groupGrowPrice的均匀分组
    const groupCount = Math.ceil(groupGrowPrice / priceUnit);
    for (let i = 0; i <= groupCount; i++) {
      groups[i * priceUnit] = 0;
    }
    
    // 大于groupGrowPrice的非均匀分组 - 使用指数增长的间隔
    if (maxItemPrice > groupGrowPrice) {
      const highPriceItems = items.filter(item => item.marketPrice / 100 > groupGrowPrice);
      const highPrices = highPriceItems.map(item => item.marketPrice / 100).sort((a, b) => a - b);
      
      if (highPrices.length > 0) {
        const minHighPrice = Math.min(...highPrices);
        const maxHighPrice = Math.max(...highPrices);
        const priceRange = maxHighPrice - groupGrowPrice;
        
        // 创建8个非均匀分组来覆盖200+的价格范围
        const groupCount = 8;
        for (let i = 0; i < groupCount; i++) {
          // 使用指数函数创建非均匀间隔
          const ratio = Math.pow(i / (groupCount - 1), 1.5); // 指数为1.5，使间隔逐渐增大
          const groupPrice = groupGrowPrice + ratio * priceRange;
          groups[Math.round(groupPrice)] = 0;
        }
      }
    }
    
    // 统计每个价格段的商品数量
    items.forEach(item => {
      const price = item.marketPrice / 100;
      let groupKey;
      
      if (price <= groupGrowPrice) {
        groupKey = Math.floor(price / priceUnit) * priceUnit;
      } else {
        // 找到最接近的高价分组
        const highPriceGroups = Object.keys(groups)
          .map(Number)
          .filter(p => p > groupGrowPrice)
          .sort((a, b) => a - b);
        
        groupKey = highPriceGroups.reduce((closest, current) => {
          return Math.abs(current - price) < Math.abs(closest - price) ? current : closest;
        }, highPriceGroups[0] || groupGrowPrice);
      }
      
      groups[groupKey] = (groups[groupKey] || 0) + 1;
    });
    
    return Object.entries(groups)
      .map(([price, count]) => ({ price: Number(price), count }))
      .filter((group) => group.count > 0) // 只保留有数据的分组
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

  useEffect(() => {
    onRangeChange(localMinPrice, maxItemPrice);

    // 监听容器宽度变化
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 计算非均匀X轴位置
  const getXPosition = (price: number) => {
    if (price <= groupGrowPrice) {
      // 前2/3空间用于0-200的价格
      return padding + (price / groupGrowPrice) * (chartWidth * 2 / 3);
    } else {
      // 后1/3空间用于200+的价格
      const highPriceStart = padding + chartWidth * 2 / 3;
      const highPriceWidth = chartWidth / 3;
      const normalizedPrice = (price - groupGrowPrice) / (totalPriceRange - groupGrowPrice);
      return highPriceStart + normalizedPrice * highPriceWidth;
    }
  };

  // 生成路径数据
  const pathData = React.useMemo(() => {
    if (priceGroups.length === 0) return '';
    
    const points = priceGroups.map((group, index) => {
      const x = getXPosition(group.price);
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
  }, [priceGroups, maxCount, chartWidth, chartHeight, height, padding, totalPriceRange]);

  // 计算垂线位置
  const minLineX = getXPosition(localMinPrice);
  const maxLineX = getXPosition(localMaxPrice);

  // 处理拖拽
  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  // 根据X位置反推价格
  const getPriceFromX = (x: number) => {
    const relativeX = Math.max(padding, Math.min(x, width - padding));
    const highPriceStart = padding + chartWidth * 2 / 3;
    
    if (relativeX <= highPriceStart) {
      // 前2/3区域：0-200价格
      return ((relativeX - padding) / (chartWidth * 2 / 3)) * groupGrowPrice;
    } else {
      // 后1/3区域：200+价格
      const normalizedX = (relativeX - highPriceStart) / (chartWidth / 3);
      return groupGrowPrice + normalizedX * (totalPriceRange - groupGrowPrice);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const price = getPriceFromX(x);
    
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
          <div className="w-14 flex items-center rounded bg-gray-100 pl-1.5 outline-1 -outline-offset-1 outline-gray-300  has-[input:focus-within]:outline-indigo-600">
            <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">¥</div>
            <input 
              type="number" 
              name="price-min" 
              id="price-min" 
              value={Math.round(localMinPrice)}
              onChange={(e) => {
                const newMin = Math.max(0, Math.min(Number(e.target.value), localMaxPrice - priceUnit));
                setLocalMinPrice(newMin);
                onRangeChange(newMin, localMaxPrice);
              }}
              className="block min-w-0 grow  px-1 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" placeholder="125" />
          </div>
          <span>-</span>
          
          <div className="w-14 flex items-center rounded bg-gray-100 pl-1.5 outline-1 -outline-offset-1 outline-gray-300  has-[input:focus-within]:outline-indigo-600">
            <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">¥</div>
            <input 
              type="number" 
              name="price-max" 
              id="price-max" 
              value={Math.round(localMaxPrice)}
              onChange={(e) => {
                const newMax = Math.min(totalPriceRange, Math.max(Number(e.target.value), localMinPrice + priceUnit));
                setLocalMaxPrice(newMax);
                onRangeChange(localMinPrice, newMax);
              }}
              
              className="block min-w-0 grow  px-1 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" placeholder="125" />
          </div>

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
            y1={4}
            x2={minLineX}
            y2={height - padding}
            stroke="#786DF6"
            strokeWidth="1.4"
            stroke-dasharray="3,2" d="M5 40 l215 0"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('min')}
          />
          <circle
            cx={minLineX}
            cy={1}
            r="4"
            fill="#786DF6"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('min')}
          />
          
          {/* 最大价格垂线 */}
          <line
            x1={maxLineX}
            y1={4}
            x2={maxLineX}
            y2={height - padding}
            stroke="#786DF6"
            strokeWidth="1.4"
            stroke-dasharray="3,2" d="M5 40 l215 0"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('max')}
          />
          <circle
            cx={maxLineX}
            cy={1}
            r="4"
            fill="#786DF6"
            className="cursor-ew-resize"
            onMouseDown={() => handleMouseDown('max')}
          />
          
          {/* X轴标签 */}
          {/* {priceGroups.filter((_, i) => i % Math.ceil(priceGroups.length / 6) === 0 || i ==priceGroups.length-1).map(({price}) => { */}
          {/* {[0,20,50,100,150,200,250,maxItemPrice].map( */}
          {[20,
            ...Array.from({length: groupGrowPrice/50}, (_, i) => i*50),
            ...Array.from({length:2}, (_, i) => Math.ceil((maxItemPrice -groupGrowPrice)/2 /50) * 50 * i + groupGrowPrice),
            maxItemPrice
          ].map(price=>{
            const x = getXPosition(price);
            return (
              <text
                key={price}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                ¥{price}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};