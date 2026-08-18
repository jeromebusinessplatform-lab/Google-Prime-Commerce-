import React, { useEffect, useState } from 'react';

export function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const refresh = async () => {
    const res = await fetch('/v1/support/tickets');
    const data = await res.json();
    setTickets(data.data || []);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const createTicket = async () => {
    await fetch('/v1/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    });
    setSubject('');
    setBody('');
    await refresh();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
      <h2 className="text-xl uppercase tracking-tighter">Support</h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full border rounded px-3 py-2 bg-transparent" />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message" className="w-full border rounded px-3 py-2 bg-transparent min-h-32" />
        <button onClick={createTicket} className="px-4 py-2 bg-black text-white rounded">Create Ticket</button>
      </div>
      <div className="text-xs text-gray-500 uppercase">Ticket list is persisted server-side.</div>
      <div className="space-y-3">
        {tickets.map(ticket => (
          <div key={ticket.id} className="p-4 border rounded-xl bg-white dark:bg-gray-900 flex justify-between items-center">
             <div>
               <div className="text-sm uppercase font-bold">{ticket.subject}</div>
               <div className="text-xs text-gray-500">{ticket.body}</div>
             </div>
             <div className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{ticket.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
