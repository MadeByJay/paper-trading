import React, { useState } from 'react';
import { useGetInstrumentsQuery, type Instrument } from '../store/apiSlice';

export const InstrumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError, refetch } = useGetInstrumentsQuery(
    searchTerm ? { search: searchTerm, limit: 50 } : undefined,
  );

  const instruments = data?.instruments ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Instruments</h1>

      <div className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1"
          placeholder="Search by symbol or name"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button className="border rounded px-3 py-1" onClick={() => refetch()}>
          Search
        </button>
      </div>

      {isLoading && <p>Loading instruments...</p>}
      {isError && <p>Could not load instruments.</p>}

      {!isLoading && !isError && (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Symbol</th>
              <th className="px-2 py-1 border">Name</th>
              <th className="px-2 py-1 border">Type</th>
              <th className="px-2 py-1 border">Currency</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((instrument: Instrument) => (
              <tr key={instrument.id}>
                <td className="px-2 py-1 border">{instrument.symbol}</td>
                <td className="px-2 py-1 border">{instrument.name}</td>
                <td className="px-2 py-1 border">{instrument.instrumentType}</td>
                <td className="px-2 py-1 border">{instrument.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
