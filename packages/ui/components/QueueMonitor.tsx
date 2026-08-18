import React, { useEffect, useState } from 'react';

export function QueueMonitor() {
  const [data, setData] = useState<any>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    // 15-second polling interval
    const fetchSummary = async () => {
      try {
        const res = await fetch('/v1/order-queue/summary');
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setIsStale(false);
        } else {
          setIsStale(true);
        }
      } catch {
        setIsStale(true);
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  const blocks = [
    { label: "ON QUEUE", value: data?.on_queue_count ?? "—" },
    { label: "PROCESSING", value: data?.processing_count ?? "—" },
    { label: "EST. WAIT", value: data?.estimated_wait_minutes != null ? `${data.estimated_wait_minutes} MIN` : "—" },
    { label: "EST. DISPATCH", value: data?.estimated_dispatch_minutes != null ? `${data.estimated_dispatch_minutes} MIN` : "—" },
    { label: "ORDER TRAFFIC", value: data?.traffic ?? "—" },
  ];

  return (
    <div className="fixed top-[calc(55px+env(safe-area-inset-top,0px))] left-0 right-0 h-12 bg-white dark:bg-gray-900 border-b border-prime-gray-200 dark:border-gray-800 z-40 flex shadow-sm transition-colors">
      {blocks.map((block, idx) => (
        <div 
          key={idx} 
          className="flex-1 flex flex-col justify-center items-center border-r border-prime-gray-200 dark:border-gray-800 last:border-r-0 px-1 overflow-hidden"
        >
          <div className="text-[10px] font-bold text-prime-gray-500 uppercase tracking-wider whitespace-nowrap text-center w-full truncate">{block.label}</div>
          <div className={`text-sm font-bold tracking-tight whitespace-nowrap text-center w-full truncate ${isStale ? 'text-gray-400' : 'text-prime-text'}`}>{block.value}</div>
        </div>
      ))}
    </div>
  );
}
