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
    <div className="font-heading fixed top-[calc(55px+env(safe-area-inset-top,0px))] left-0 right-0 h-[35px] bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 flex transition-colors">
      {blocks.map((block, idx) => (
        <div 
          key={idx} 
          className="flex-1 flex flex-col justify-center items-center border-r border-gray-200 dark:border-gray-800 last:border-r-0 px-1 overflow-hidden"
        >
          <div className="text-[8.3px] leading-tight text-gray-500 dark:text-gray-400  whitespace-nowrap text-center w-full truncate">{block.label}</div>
          <div className={`text-[11px] leading-tight  whitespace-nowrap text-center w-full truncate ${isStale ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{block.value}</div>
        </div>
      ))}
    </div>
  );
}
