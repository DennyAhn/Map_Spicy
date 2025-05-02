// src/services/directionApi.js
export const directionRequest = async (start, goal) => {
  const url = `http://15.164.94.96:3001/direction?start=${start}&goal=${goal}`;
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Direction 요청 실패");
  }
  return await response.json();
};
