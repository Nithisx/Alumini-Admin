const BASE_URL = "https://api.karpagamalumni.in/api/v1";

const myPostsCacheByToken = new Map();
const inFlightByToken = new Map();

export const getMyPosts = async (token, options = {}) => {
  const { force = false } = options;

  if (!token) {
    throw new Error("Token not found");
  }

  if (!force && myPostsCacheByToken.has(token)) {
    return myPostsCacheByToken.get(token);
  }

  if (!force && inFlightByToken.has(token)) {
    return inFlightByToken.get(token);
  }

  const request = fetch(`${BASE_URL}/myposts/`, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch my posts: ${response.status}`);
    }

    const data = await response.json();
    myPostsCacheByToken.set(token, data);
    return data;
  }).finally(() => {
    inFlightByToken.delete(token);
  });

  inFlightByToken.set(token, request);
  return request;
};

export const clearMyPostsCache = (token) => {
  if (!token) {
    return;
  }
  myPostsCacheByToken.delete(token);
  inFlightByToken.delete(token);
};
