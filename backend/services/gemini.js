import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

function getGenAI() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Generate a polished answer using Gemini, given a query and retrieved context chunks.
 * @param {string} query - The user's question
 * @param {Array<{text: string, score: number}>} retrievedChunks - Context chunks from Pinecone
 * @returns {Promise<string>} The generated answer
 */
export async function generateAnswer(query, retrievedChunks) {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextBlock = retrievedChunks
        .map(
            (chunk, i) =>
                `--- Context Chunk ${i + 1} (Relevance: ${(chunk.score * 100).toFixed(1)}%) ---\n${chunk.text}`
        )
        .join("\n\n");

    const prompt = `You are a helpful assistant that answers questions based ONLY on the provided context. If the answer cannot be found in the context, say so clearly.

CONTEXT:
${contextBlock}

QUESTION: ${query}

Provide a clear, well-structured answer based on the context above. If the context doesn't contain enough information to fully answer the question, mention what information is available and what's missing.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}
