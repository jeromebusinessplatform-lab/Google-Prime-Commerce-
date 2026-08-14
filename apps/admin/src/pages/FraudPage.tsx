import React, { useEffect, useState } from 'react';

export function FraudPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const res = await fetch('/v1/fraud/cases');
    const data = await res.json();
    setCases(data.data || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const createCase = async () => {
    await fetch('/v1/fraud/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, notes }),
    });
    setTitle('');
    setNotes('');
    load();
  };

  const updateCase = async (id: string, status: string) => {
    await fetch(`/v1/fraud/cases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
      <h2 className="text-xl uppercase tracking-tighter">Fraud Cases</h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Case title" className="w-full border rounded px-3 py-2 bg-transparent" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="w-full border rounded px-3 py-2 bg-transparent min-h-28" />
        <button onClick={createCase} className="px-4 py-2 bg-black text-white rounded">Open Case</button>
      </div>
      <div className="space-y-3">
        {cases.map(item => (
          <div key={item.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm uppercase">{item.title || item.id}</div>
              <div className="text-xs text-gray-500">{item.status}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateCase(item.id, 'reviewing')} className="px-3 py-2 text-xs rounded border">Review</button>
              <button onClick={() => updateCase(item.id, 'closed')} className="px-3 py-2 text-xs rounded border">Close</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
