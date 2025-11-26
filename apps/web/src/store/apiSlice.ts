import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export type Instrument = {
  id: string;
  symbol: string;
  name: string;
  instrumentType: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX';
  currency: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: AuthenticatedUser;
  defaultAccountId: string | null;
};

export type MeResponse = {
  user: AuthenticatedUser;
  defaultAccountId: string | null;
};

export type WatchlistSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type WatchlistItem = {
  id: string;
  positionInList: number;
  instrument: Instrument;
};

export type WatchlistDetails = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
};

const defaultLimit = 50;

export const apiSlice = createApi({
  reducerPath: 'tradingPlatformApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, apiContext) => {
      const state = apiContext.getState() as RootState;
      const authToken = state.auth.token;
      state;

      if (authToken) {
        headers.set('authorization', `Bearer ${authToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Watchlists', 'Watchlist'],
  endpoints: (build) => ({
    getHelloMessage: build.query<{ message: string }, void>({
      query: () => '/hello',
    }),

    getInstruments: build.query({
      query: (parameters) => {
        const search = parameters?.search;
        const limit = parameters?.limit || defaultLimit;
        const searchParams = new URLSearchParams();

        if (search) {
          searchParams.set('search', search);
        }

        searchParams.set('limit', limit);

        return `/instruments?${searchParams.toString()}`;
      },
    }),

    registerUser: build.mutation<
      AuthResponse,
      { email: string; password: string; displayName: string }
    >({
      query: (requestBody) => {
        return {
          url: '/auth/register',
          method: 'POST',
          body: requestBody,
        };
      },
    }),

    loginUser: build.mutation<
      AuthResponse,
      { email: string; password: string }
    >({
      query: (requestBody) => {
        return {
          url: '/auth/login',
          method: 'POST',
          body: requestBody,
        };
      },
    }),

    getCurrentUser: build.query<MeResponse, void>({
      query: () => '/auth/me',
    }),

    getWatchlists: build.query<{ watchlists: WatchlistSummary[] }, void>({
      query: () => '/watchlists',
      providesTags: ['Watchlists'],
    }),

    getWatchlistById: build.query<{ watchlist: WatchlistDetails }, string>({
      query: (watchlistId) => `/watchlists/${watchlistId}`,
      providesTags: (result, error, watchlistId) => [
        { type: 'Watchlist', id: watchlistId },
      ],
    }),

    createWatchlist: build.mutation<
      { watchlist: WatchlistSummary },
      { name: string }
    >({
      query: (requestBody) => ({
        url: '/watchlists',
        method: 'POST',
        body: requestBody,
      }),
      invalidatesTags: ['Watchlists'],
    }),

    addInstrumentToWatchlist: build.mutation({
      query: ({ watchlistId, instrumentId }) => ({
        url: `/watchlists/${watchlistId}/instruments`,
        method: 'POST',
        body: { instrumentId },
      }),
    }),

    removeInstrumentFromWatchlist: build.mutation<
      void,
      { watchlistId: string; instrumentId: string }
    >({
      query: ({ watchlistId, instrumentId }) => ({
        url: `/watchlists/${watchlistId}/instruments/${instrumentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, argumentsObject) => [
        { type: 'Watchlist', id: argumentsObject.watchlistId },
      ],
    }),
  }),
});
export const {
  useGetHelloMessageQuery,
  useGetInstrumentsQuery,
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetCurrentUserQuery,
  useGetWatchlistsQuery,
  useGetWatchlistByIdQuery,
  useCreateWatchlistMutation,
  useAddInstrumentToWatchlistMutation,
  useRemoveInstrumentFromWatchlistMutation,
} = apiSlice;
