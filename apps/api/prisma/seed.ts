import { prismaClient } from '../src/prismaClient';

async function seedInstruments() {
  const instruments = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      instrumentType: 'STOCK' as const,
      currency: 'USD',
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      instrumentType: 'STOCK' as const,
      currency: 'USD',
    },
    {
      symbol: 'BTC-USD',
      name: 'Bitcoin / US Dollar',
      instrumentType: 'CRYPTO' as const,
      currency: 'USD',
    },
  ];

  for (const instrument of instruments) {
    await prismaClient.instrument.upsert({
      where: { symbol: instrument.symbol },
      update: {},
      create: instrument,
    });
  }
}

async function main() {
  await seedInstruments();
}

main()
  .then(async () => {
    await prismaClient.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Seed completed');
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    await prismaClient.$disconnect();
    process.exit(1);
  });
