import { useState, useEffect } from 'react';

function LeaderBoard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const data = await response.json();
      setLeaderboardData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    return Number(amount).toFixed(5);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <div className="loader border-t-4 border-green-500 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Error loading leaderboard: {error}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-green-100">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
        Leaderboard
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gradient-to-r from-[#00361d] to-[#008849] text-white">
              <th className="px-4 py-2 rounded-tl-xl">User ID</th>
              <th className="px-4 py-2">Wallet</th>
              <th className="px-4 py-2 rounded-tr-xl text-right">Total TAC</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr 
                key={entry.userId} 
                className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150 ${
                  index < 5 ? 'bg-green-50/50' : ''
                }`}
              >
                <td className="px-4 py-3">{entry.userId}</td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600">
                  {formatAddress(entry.wallet)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatAmount(entry.totalAmount)} TAC
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderBoard;