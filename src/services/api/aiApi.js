import { apiClient } from './client';

export const aiApi = {
  /**
   * Calls the backend AI parsing endpoint to structure free-text donation descriptions.
   * @param {string} text - Natural language donation description.
   * @returns {Promise<Object>} - Structured donation data.
   */
  async parseDonation(text) {
    const res = await apiClient.post('/ai/parse-donation', { text });
    return res.data;
  },

  /**
   * Requests a human-readable AI explanation for an existing deterministic match recommendation.
   * @param {string} matchId - The database ID of the match record.
   * @returns {Promise<Object>} - Explanation object with summary and reasons.
   */
  async explainMatch(matchId) {
    const res = await apiClient.post('/ai/explain-match', { matchId });
    return res.data;
  }
};

