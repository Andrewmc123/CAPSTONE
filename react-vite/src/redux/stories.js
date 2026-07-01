// Stories are ephemeral (24h) — no reducer/state needed; components fetch on
// demand and the profile refetches to update the story ring.

export const thunkCreateStory = (payload) => async () => {
  const res = await fetch("/api/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.ok) return res.json();
  return null;
};

export const thunkFetchUserStories = (userId) => async () => {
  const res = await fetch(`/api/stories/user/${userId}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    return data.stories || [];
  }
  return [];
};

export const thunkDeleteStory = (storyId) => async () => {
  const res = await fetch(`/api/stories/${storyId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.ok;
};
