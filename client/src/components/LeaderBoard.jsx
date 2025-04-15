import { useState, useEffect } from 'react';

function LeaderBoard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetKey, setResetKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleReset = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/reset-leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: resetKey }),
      });

      if (!response.ok) {
        throw new Error('Invalid reset key');
      }

      // Refresh leaderboard data
      await fetchLeaderboardData();
      setResetKey('');
      alert('Leaderboard reset successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
          Leaderboard
        </h2>
        <button
          onClick={() => setIsAdmin(!isAdmin)}
          className="text-sm px-3 py-1 rounded-lg bg-[#00361d] text-white hover:bg-[#004d29] transition-colors"
        >
          {isAdmin ? 'Hide Admin' : 'Admin'}
        </button>
      </div>

      {isAdmin && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <input
            type="password"
            value={resetKey}
            onChange={(e) => setResetKey(e.target.value)}
            placeholder="Enter reset key"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 mb-2"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reset Leaderboard
            </button>
            <button
              onClick={() => {
                setIsAdmin(false);
                setResetKey('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                key={`${entry.userId}-${entry.wallet}`} 
                className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150 ${
                  index < 5 ? 'bg-green-50/50' : ''
                }`}
              >
                <td className="px-4 py-3">{entry.userId || 'Unknown'}</td>
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