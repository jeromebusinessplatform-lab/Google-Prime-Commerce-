import React, { useEffect, useState } from 'react';

export function ReportsPage() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch('/v1/reports/operational')
      .then(r => r.json())
      .then(setReport)
      .catch(() => setReport(null));
  }, []);

  if (!report) {
    return <div className="p-8 text-center uppercase tracking-widest text-gray-400">Loading Reports...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
      <h2 className="text-xl uppercase tracking-tighter">Reports</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Orders', report.orders],
          ['Customers', report.customers],
          ['Revenue', `₱${Number(report.revenue || 0).toLocaleString()}`],
          ['Reviews', report.paymentReviewCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="border rounded-xl p-4 bg-white dark:bg-gray-900">
            <div className="text-[10px] uppercase tracking-widest text-gray-400">{label}</div>
            <div className="text-2xl mt-2">{String(value)}</div>
          </div>
        ))}
      </div>
      <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 text-sm space-y-2">
        <div>Validated: {report.validatedCount}</div>
        <div>Unvalidated: {report.unvalidatedCount}</div>
        <div>Open Support Tickets: {report.openSupportTickets}</div>
        <div>Open Fraud Cases: {report.openFraudCases}</div>
      </div>
    </div>
  );
}
