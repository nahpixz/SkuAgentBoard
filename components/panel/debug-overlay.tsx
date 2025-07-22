import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { X, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface DebugData {
  screenshot?: string | null;
  screenshotB?: string | null;
  details?: Record<string, any>;
}

export interface DebugOverlayRef {
  set: (data: DebugData) => void;
  setIsVisible: (visible: boolean) => void;
}

const DebugOverlay = forwardRef<DebugOverlayRef, {}>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<DebugData>({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useImperativeHandle(ref, () => ({
    set: (data: DebugData) => {
      setDebugData(data);
      setIsVisible(true); // Automatically show when new data is set
    },
    setIsVisible,
  }));

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] font-sans flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            {isSidebarVisible ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
          </button>
          <h3 className="text-lg font-semibold">Debug Panel</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Collapsible Sidebar for Screenshots */}
        <aside
          className={`flex-shrink-0 bg-white/5 transition-all duration-300 ease-in-out flex flex-col gap-4 overflow-y-auto p-3 ${isSidebarVisible ? 'w-[300px]' : 'w-0 p-0'}`}>
          {/* Screenshot 1 (9:21) */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-400 text-center">Screenshot A (9:21)</h4>
            <div className="bg-black/20 rounded-lg p-1 flex items-center justify-center relative aspect-[9/21]">
              {debugData.screenshot ? (
                <img src={debugData.screenshot} className="object-contain w-full h-full rounded" />
              ) : <div className="w-full h-full flex items-center justify-center text-gray-500 bg-black/20 rounded">No Image</div>}
            </div>
          </div>

          {/* Screenshot 2 (5:3) */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-400 text-center">Screenshot B (5:3)</h4>
            <div className="bg-black/20 rounded-lg p-1 flex items-center justify-center relative aspect-[5/3]">
              {debugData.screenshotB ? (
                <img src={debugData.screenshotB} className="object-contain w-full h-full rounded" />
              ) : <div className="w-full h-full flex items-center justify-center text-gray-500 bg-black/20 rounded">No Image</div>}
            </div>
          </div>
        </aside>

        {/* Main Content for Details */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-black/20 overflow-y-auto p-4 space-y-4">
            {debugData.details && Object.keys(debugData.details).length > 0 ? (
              Object.entries(debugData.details).map(([key, value]) => (
                <div key={key} className="bg-gray-900/70 rounded-lg overflow-hidden border border-white/10">
                  <div className="text-sm font-mono text-cyan-300 bg-white/5 px-4 py-2 border-b border-white/10 font-semibold">{key}</div>
                  <div className="text-xs font-mono">
                    <SyntaxHighlighter
                      language="json"
                      style={vscDarkPlus}
                      showLineNumbers
                      wrapLines
                      customStyle={{ background: 'transparent', padding: '1rem', margin: 0 }}
                      codeTagProps={{ style: { fontFamily: 'inherit' } }}
                    >
                      {JSON.stringify(value, null, 2)}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No data to display.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
});

DebugOverlay.displayName = 'DebugOverlay';

export default DebugOverlay;