import { Hono } from "hono";
import { cors } from "hono/cors";
import { MongoClient, type Collection } from "mongodb";

const API_VERSION = "v1";
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error("MONGO_URL is required");
}

const mongoClient = new MongoClient(MONGO_URL);
const databaseName = new URL(MONGO_URL).pathname.replace(/^\//, "") || "meshbay";
const mongoDatabase = mongoClient.db(databaseName);

type ItemDocument = {
  name: string;
  created_at: Date;
};

type ItemResponse = {
  id: string;
  name: string;
  created_at: string;
};

const itemsCollection: Collection<ItemDocument> = mongoDatabase.collection<ItemDocument>("items");

function toItemResponse(document: ItemDocument & { _id: unknown }): ItemResponse {
  return {
    id: String(document._id),
    name: document.name,
    created_at: document.created_at.toISOString(),
  };
}

async function ensureCollection(): Promise<void> {
  const existingCollections = await mongoDatabase
    .listCollections({ name: "items" }, { nameOnly: true })
    .toArray();
  if (existingCollections.length === 0) {
    await mongoDatabase.createCollection("items");
  }
}

const application = new Hono();

application.use("*", cors());

application.get("/health", (requestContext) =>
  requestContext.json({ status: "ok", version: API_VERSION }),
);

application.get("/api/items", async (requestContext) => {
  const documents = await itemsCollection.find().sort({ _id: 1 }).limit(100).toArray();
  return requestContext.json(documents.map(toItemResponse));
});

application.post("/api/items", async (requestContext) => {
  const payload: unknown = await requestContext.req.json().catch(() => null);
  const itemName =
    typeof payload === "object" && payload !== null && "name" in payload && typeof payload.name === "string"
      ? payload.name.trim()
      : "";
  if (itemName === "") {
    return requestContext.json({ error: "name is required" }, 400);
  }
  const createdAt = new Date();
  const insertResult = await itemsCollection.insertOne({ name: itemName, created_at: createdAt });
  return requestContext.json(
    { id: String(insertResult.insertedId), name: itemName, created_at: createdAt.toISOString() },
    201,
  );
});

await ensureCollection();

const port = Number(process.env.PORT ?? 8080);
Bun.serve({ port, fetch: application.fetch });
console.log(`listening on port ${port}`);
