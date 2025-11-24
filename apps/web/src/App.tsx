import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { useGetHelloMessageQuery } from './store/apiSlice';

const DashboardPage: React.FC = () => {
  const { data, isLoading, isError } = useGetHelloMessageQuery();

  if (isLoading) {
    return <p>Loading greeting from API...</p>;
  }

  if (isError || !data) {
    return <p>Could not load greeting from API.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Trading Platform Dashboard (Skeleton)</h1>
      <p>{data.message}</p>
      <p className="mt-2 text-sm text-gray-600">
        This confirms the frontend, backend, and proxy are all wired together.
      </p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="p-4">
      <nav className="mb-4">
        <Link to="/" className="font-semibold">
          Dashboard
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </div>
  );
};

export default App;
