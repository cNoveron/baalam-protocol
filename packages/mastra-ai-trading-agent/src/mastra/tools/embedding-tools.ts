import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const generateAndStoreEmbeddings = createTool({
  id: "Generate and store embeddings",
  inputSchema: z.object({
    text: z.string().describe("The text to generate embeddings for"),
    pointId: z.number().optional().describe("Optional ID for the vector point (auto-generated if not provided)"),
    metadata: z.record(z.any()).optional().describe("Optional metadata to store with the embedding")
  }),
  description: "Generate embeddings from text using llama-server-api and store them in Qdrant vector database",
  execute: async ({ context }) => {
    const { text, pointId, metadata } = context;

    try {
      // Step 1: Generate embeddings using llama-server-api
      console.log("Generating embeddings for text:", text.substring(0, 100) + "...");

      const embeddingResponse = await fetch("http://localhost:9069/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002",
          encoding_format: "float"
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status} ${embeddingResponse.statusText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      console.log("Generated embedding vector of length:", embedding.length);

      // Step 2: Generate point ID if not provided
      const finalPointId = pointId || Math.floor(Math.random() * 1000000);

      // Step 3: Store embedding in Qdrant
      const qdrantPayload = {
        points: [
          {
            id: finalPointId,
            vector: embedding,
            payload: {
              text: text,
              timestamp: new Date().toISOString(),
              ...metadata
            }
          }
        ]
      };

      console.log("Storing embedding in Qdrant with ID:", finalPointId);

      const qdrantResponse = await fetch("http://localhost:6333/collections/default/points", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qdrantPayload)
      });

      if (!qdrantResponse.ok) {
        throw new Error(`Qdrant API error: ${qdrantResponse.status} ${qdrantResponse.statusText}`);
      }

      const qdrantResult = await qdrantResponse.json();

      return {
        success: true,
        pointId: finalPointId,
        embeddingLength: embedding.length,
        textLength: text.length,
        metadata: metadata,
        qdrantResult: qdrantResult
      };

    } catch (error) {
      console.error("Error in generateAndStoreEmbeddings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        pointId: null
      };
    }
  },
});

export const searchSimilarEmbeddings = createTool({
  id: "Search similar embeddings",
  inputSchema: z.object({
    queryText: z.string().describe("The text to search for similar embeddings"),
    limit: z.number().optional().default(5).describe("Number of similar results to return"),
    scoreThreshold: z.number().optional().describe("Minimum similarity score threshold")
  }),
  description: "Search for similar embeddings in Qdrant vector database based on query text",
  execute: async ({ context }) => {
    const { queryText, limit, scoreThreshold } = context;

    try {
      // Step 1: Generate embedding for query text
      console.log("Generating query embedding for:", queryText.substring(0, 100) + "...");

      const embeddingResponse = await fetch("http://localhost:9069/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: queryText,
          model: "text-embedding-ada-002",
          encoding_format: "float"
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status} ${embeddingResponse.statusText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Step 2: Search similar vectors in Qdrant
      const searchPayload = {
        vector: queryEmbedding,
        limit: limit,
        with_payload: true,
        ...(scoreThreshold && { score_threshold: scoreThreshold })
      };

      console.log("Searching for similar embeddings in Qdrant...");

      const searchResponse = await fetch("http://localhost:6333/collections/default/points/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchPayload)
      });

      if (!searchResponse.ok) {
        throw new Error(`Qdrant search error: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchResults = await searchResponse.json();

      return {
        success: true,
        queryText: queryText,
        results: searchResults.result.map((item: any) => ({
          id: item.id,
          score: item.score,
          text: item.payload?.text,
          metadata: item.payload,
        }))
      };

    } catch (error) {
      console.error("Error in searchSimilarEmbeddings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results: []
      };
    }
  },
});

export const ensureQdrantCollection = createTool({
  id: "Ensure Qdrant collection exists",
  inputSchema: z.object({
    collectionName: z.string().optional().default("default").describe("Name of the collection to create/ensure"),
    vectorSize: z.number().optional().default(1536).describe("Size of the embedding vectors")
  }),
  description: "Ensure that a Qdrant collection exists, create it if it doesn't",
  execute: async ({ context }) => {
    const { collectionName, vectorSize } = context;

    try {
      // Check if collection exists
      const checkResponse = await fetch(`http://localhost:6333/collections/${collectionName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (checkResponse.ok) {
        console.log(`Collection '${collectionName}' already exists`);
        return {
          success: true,
          message: `Collection '${collectionName}' already exists`,
          action: "none"
        };
      }

      // Create collection if it doesn't exist
      console.log(`Creating collection '${collectionName}' with vector size ${vectorSize}`);

      const createPayload = {
        vectors: {
          size: vectorSize,
          distance: "Cosine"
        }
      };

      const createResponse = await fetch(`http://localhost:6333/collections/${collectionName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPayload)
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create collection: ${createResponse.status} ${createResponse.statusText}`);
      }

      const createResult = await createResponse.json();

      return {
        success: true,
        message: `Collection '${collectionName}' created successfully`,
        action: "created",
        result: createResult
      };

    } catch (error) {
      console.error("Error in ensureQdrantCollection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        action: "failed"
      };
    }
  },
});