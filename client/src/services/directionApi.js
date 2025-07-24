// src/services/directionApi.js
import { API_BASE_URL } from '../config/api';

export const directionRequest = async (start, goal) => {
  const url = `${API_BASE_URL}/direction?start=${start}&goal=${goal}`;
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Direction 요청 실패");
  }
  return await response.json();
};
