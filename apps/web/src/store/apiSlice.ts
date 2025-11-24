import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'tradingPlatformApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  endpoints: (build) => ({
    getHelloMessage: build.query<{ message: string }, void>({
      query: () => '/hello',
    }),
  }),
});

export const { useGetHelloMessageQuery } = apiSlice;
