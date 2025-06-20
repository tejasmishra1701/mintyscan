import { API_ENDPOINTS } from './config';

export const fetchLeaderboard = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.leaderboard);
        return await response.json();
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};

export const getMintSignature = async (userId, wallet, amount) => {
    try {
        const response = await fetch(API_ENDPOINTS.mintSignature, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, wallet, amount })
        });
        return await response.json();
    } catch (error) {
        console.error('Error getting mint signature:', error);
        throw error;
    }
};