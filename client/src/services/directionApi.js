// src/services/directionApi.js
export const directionRequest = async (start, goal) => {
<<<<<<< HEAD
  const PROXY_URL = 'http://15.164.94.96:3001/';
  const url = `${PROXY_URL}direction?start=${start}&goal=${goal}`;
=======
  const PROXY_URL = 'http://15.164.94.96:3001';
  const url = `${PROXY_URL}/direction?start=${start}&goal=${goal}`;
>>>>>>> main
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Direction 요청 실패");
  }
  return await response.json();
};
