import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type Instrument = {
  id: string;
  symbol: string;
  name: string;
  instrumentType: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX';
  currency: string;
};
const defaultLimit = 50;

export const apiSlice = createApi({
  reducerPath: 'tradingPlatformApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
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
  }),
});

export const { useGetHelloMessageQuery, useGetInstrumentsQuery } = apiSlice;
