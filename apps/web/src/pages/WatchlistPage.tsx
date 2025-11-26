import { useEffect, useState } from 'react';
import {
  useGetWatchlistsQuery,
  useGetWatchlistByIdQuery,
  useCreateWatchlistMutation,
  useRemoveInstrumentFromWatchlistMutation,
} from '../store/apiSlice';

export function WatchlistPage() {
  const { data: watchlistsResponse, isLoading: isLoadingWatchlists } =
    useGetWatchlistsQuery();
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(
    null,
  );

  const [createWatchlistMutation, createWatchlistResult] =
    useCreateWatchlistMutation();
  const [removeInstrumentFromWatchlistMutation] =
    useRemoveInstrumentFromWatchlistMutation();

  const watchlists = watchlistsResponse?.watchlists ?? [];

  useEffect(() => {
    if (!selectedWatchlistId && watchlists.length > 0) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [selectedWatchlistId, watchlists]);

  const {
    data: watchlistDetailsResponse,
    isLoading: isLoadingWatchlistDetails,
  } = useGetWatchlistByIdQuery(selectedWatchlistId ?? '', {
    skip: !selectedWatchlistId,
  });

  const currentWatchlist = watchlistDetailsResponse?.watchlist;

  async function handleCreateWatchlistSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const watchlistName = String(formData.get('name') ?? '').trim();

    if (!watchlistName) {
      return;
    }

    const created = await createWatchlistMutation({
      name: watchlistName,
    }).unwrap();
    formElement.reset();

    // Automatically switch to the newly created watchlist
    setSelectedWatchlistId(created.watchlist.id);
  }

  async function handleRemoveInstrumentClick(instrumentId: string) {
    if (!selectedWatchlistId) return;

    await removeInstrumentFromWatchlistMutation({
      watchlistId: selectedWatchlistId,
      instrumentId,
    }).unwrap();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Watchlists</h1>

      <div className="mb-4 flex gap-4 items-center">
        {isLoadingWatchlists ? (
          <p>Loading watchlists...</p>
        ) : (
          <>
            <label className="text-sm">
              Select watchlist:{' '}
              <select
                className="border rounded px-2 py-1"
                value={selectedWatchlistId ?? ''}
                onChange={(event) =>
                  setSelectedWatchlistId(
                    event.target.value === '' ? null : event.target.value,
                  )
                }
              >
                {watchlists.map((watchlist) => (
                  <option key={watchlist.id} value={watchlist.id}>
                    {watchlist.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <form
        onSubmit={handleCreateWatchlistSubmit}
        className="mb-6 flex gap-2 items-center"
      >
        <input
          name="name"
          className="border rounded px-2 py-1"
          placeholder="New watchlist name"
        />
        <button
          type="submit"
          className="border rounded px-3 py-1 text-sm font-semibold"
          disabled={createWatchlistResult.isLoading}
        >
          {createWatchlistResult.isLoading ? 'Creating...' : 'Create Watchlist'}
        </button>
      </form>

      {selectedWatchlistId && (
        <>
          {isLoadingWatchlistDetails && <p>Loading watchlist details...</p>}
          {!isLoadingWatchlistDetails && currentWatchlist && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {currentWatchlist.name}
              </h2>

              {currentWatchlist.items.length === 0 ? (
                <p className="text-sm text-gray-600">
                  This watchlist is empty. Go to the Instruments page to add
                  symbols.
                </p>
              ) : (
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 border">Symbol</th>
                      <th className="px-2 py-1 border">Name</th>
                      <th className="px-2 py-1 border">Type</th>
                      <th className="px-2 py-1 border">Currency</th>
                      <th className="px-2 py-1 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWatchlist.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-1 border">
                          {item.instrument.symbol}
                        </td>
                        <td className="px-2 py-1 border">
                          {item.instrument.name}
                        </td>
                        <td className="px-2 py-1 border">
                          {item.instrument.instrumentType}
                        </td>
                        <td className="px-2 py-1 border">
                          {item.instrument.currency}
                        </td>
                        <td className="px-2 py-1 border">
                          <button
                            className="text-sm text-red-600 underline"
                            onClick={() =>
                              handleRemoveInstrumentClick(item.instrument.id)
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
