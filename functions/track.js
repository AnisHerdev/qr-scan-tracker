export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const locationId = body.location || "unknown";

    const PROJECT_ID = context.env.FIREBASE_PROJECT_ID;
    const API_KEY = context.env.FIREBASE_API_KEY;

    // 🔥 pick random shard (adjust shard count here)
    const SHARD_COUNT = 20;
    const shardId = Math.floor(Math.random() * SHARD_COUNT);

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/locations/${locationId}/shards/${shardId}?key=${API_KEY}`;

    // First try update
    const updateRes = await fetch(url + "&updateMask.fieldPaths=count&updateMask.fieldPaths=lastScanned", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          count: { integerValue: "1" },
          lastScanned: { timestampValue: new Date().toISOString() }
        }
      })
    });

    // If shard doesn't exist → create it
    if (!updateRes.ok) {
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            count: { integerValue: "1" },
            lastScanned: { timestampValue: new Date().toISOString() }
          }
        })
      });
    }

    return new Response("OK");
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}