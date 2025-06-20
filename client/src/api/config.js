export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mintyscan-2.onrender.com';

export const API_ENDPOINTS = {
    leaderboard: `${API_BASE_URL}/api/leaderboard`,
    mintSignature: `${API_BASE_URL}/api/mint-signature`,
    resetLeaderboard: `${API_BASE_URL}/api/reset-leaderboard`
};