import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize and return the Pinecone index.
 */
async function getIndex() {
    if (!pineconeIndex) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX);
    }
    return pineconeIndex;
}

/**
 * Delete all records in a given namespace (for cleanup between uploads).
 */
export async function clearNamespace(namespace) {
    try {
        const index = await getIndex();
        await index.namespace(namespace).deleteAll();
        console.log(`Cleared namespace "${namespace}"`);
    } catch (err) {
        console.log(`Skipping namespace clear (${err.message})`);
    }
}

/**
 * Upsert chunk text records into Pinecone.
 * Pinecone's integrated embedding model (llama-text-embed-v2) handles vectorization.
 * @param {Array<{id: number, text: string, startIndex: number, endIndex: number}>} chunks
 * @param {string} namespace - Pinecone namespace to use
 */
export async function upsertChunks(chunks, namespace = "default") {
    const index = await getIndex();

    // Build records — Pinecone will embed the "text" field automatically
    const records = chunks.map((chunk) => ({
        _id: `chunk-${chunk.id}`,
        text: chunk.text,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        chunkId: chunk.id,
    }));

    console.log(`Upserting ${records.length} records to namespace "${namespace}"...`);

    // Upsert in batches of 20
    const batchSize = 20;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        if (batch.length > 0) {
            await index.namespace(namespace).upsertRecords({ records: batch });
            console.log(`  Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
        }
    }

    console.log(`Successfully upserted ${records.length} records.`);
}

/**
 * Query Pinecone using text search (integrated embedding handles vectorization).
 * @param {string} queryText - The search query text
 * @param {number} topK - Number of results to return
 * @param {string} namespace - Pinecone namespace to query
 * @returns {Promise<Array<{id: string, score: number, text: string, startIndex: number, endIndex: number}>>}
 */
export async function querySimilar(queryText, topK = 3, namespace = "default") {
    const index = await getIndex();

    const results = await index.namespace(namespace).searchRecords({
        query: {
            topK,
            inputs: { text: queryText },
        },
        fields: ["text", "startIndex", "endIndex", "chunkId"],
    });

    return results.result.hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        text: hit.fields.text,
        startIndex: hit.fields.startIndex,
        endIndex: hit.fields.endIndex,
        chunkId: hit.fields.chunkId,
    }));
}
