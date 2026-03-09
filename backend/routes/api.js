import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parseDocument } from "../services/documentParser.js";
import {
    fixedSizeChunk,
    overlappingChunk,
    recursiveChunk,
    getChunkStats,
} from "../services/chunker.js";
// Embeddings handled by Pinecone's integrated model (llama-text-embed-v2)
import { clearNamespace, upsertChunks, querySimilar } from "../services/pinecone.js";
import { generateAnswer } from "../services/gemini.js";

const router = express.Router();

// Configure multer with memory storage (no disk writes — hosting friendly)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".txt", ".pdf"].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only .txt and .pdf files are supported."));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// In-memory session storage (for simplicity in a personal project)
const sessions = {};

// ─────────────────────────────────────────────
// POST /api/upload — Upload and parse a document
// ─────────────────────────────────────────────
router.post("/upload", upload.single("document"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const text = await parseDocument(req.file.buffer, ext);
        const sessionId = uuidv4();

        sessions[sessionId] = {
            fileName: req.file.originalname,
            text,
            chunks: null,
            chunkingMethod: null,
        };

        res.json({
            sessionId,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            textLength: text.length,
            textPreview: text.substring(0, 500),
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/chunk — Chunk the uploaded document
// ─────────────────────────────────────────────
router.post("/chunk", async (req, res) => {
    try {
        const { sessionId, method, chunkSize, overlap } = req.body;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: "Invalid or expired session." });
        }

        const session = sessions[sessionId];
        const text = session.text;
        let chunks;

        switch (method) {
            case "fixed":
                chunks = fixedSizeChunk(text, chunkSize || 500);
                break;
            case "overlapping":
                chunks = overlappingChunk(text, chunkSize || 500, overlap || 100);
                break;
            case "recursive":
                chunks = recursiveChunk(text, chunkSize || 500);
                break;
            default:
                return res.status(400).json({ error: `Unknown method: ${method}` });
        }

        session.chunks = chunks;
        session.chunkingMethod = method;

        const stats = getChunkStats(chunks);

        res.json({
            sessionId,
            method,
            stats,
            // Return first 20 chunks for preview
            chunks: chunks.slice(0, 20).map((c) => ({
                id: c.id,
                text: c.text,
                startIndex: c.startIndex,
                endIndex: c.endIndex,
                length: c.text.length,
            })),
            totalChunks: chunks.length,
        });
    } catch (err) {
        console.error("Chunk error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/chunks — Get paginated chunks
// ─────────────────────────────────────────────
router.get("/chunks", (req, res) => {
    try {
        const { sessionId, page = 1, limit = 20 } = req.query;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: "Invalid or expired session." });
        }

        const session = sessions[sessionId];

        if (!session.chunks) {
            return res.status(400).json({ error: "No chunks yet. Run /api/chunk first." });
        }

        const start = (page - 1) * limit;
        const end = start + parseInt(limit);
        const paginatedChunks = session.chunks.slice(start, end).map((c) => ({
            id: c.id,
            text: c.text,
            startIndex: c.startIndex,
            endIndex: c.endIndex,
            length: c.text.length,
        }));

        res.json({
            chunks: paginatedChunks,
            totalChunks: session.chunks.length,
            page: parseInt(page),
            totalPages: Math.ceil(session.chunks.length / limit),
        });
    } catch (err) {
        console.error("Chunks error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/document — Get the original document text
// ─────────────────────────────────────────────
router.get("/document", (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: "Invalid or expired session." });
        }

        const session = sessions[sessionId];
        res.json({
            fileName: session.fileName,
            text: session.text,
            textLength: session.text.length,
        });
    } catch (err) {
        console.error("Document error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/embed — Store chunks in Pinecone (embedding handled by Pinecone)
// ─────────────────────────────────────────────
router.post("/embed", async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: "Invalid or expired session." });
        }

        const session = sessions[sessionId];

        if (!session.chunks || session.chunks.length === 0) {
            return res.status(400).json({ error: "No chunks to embed. Run /api/chunk first." });
        }

        // Clear previous records in this namespace
        await clearNamespace(sessionId);

        // Upsert text records — Pinecone's integrated model handles embedding
        await upsertChunks(session.chunks, sessionId);

        session.isEmbedded = true;

        res.json({
            sessionId,
            embeddedCount: session.chunks.length,
            message: "Chunks stored in Pinecone successfully.",
        });
    } catch (err) {
        console.error("Embed error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/query — Query the RAG pipeline
// ─────────────────────────────────────────────
router.post("/query", async (req, res) => {
    try {
        const { sessionId, query, topK = 5 } = req.body;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: "Invalid or expired session." });
        }

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: "Query cannot be empty." });
        }

        const session = sessions[sessionId];

        if (!session.isEmbedded) {
            return res.status(400).json({ error: "Chunks not embedded yet. Run /api/embed first." });
        }

        // 1. Search Pinecone with text query (Pinecone handles embedding)
        const retrievedChunks = await querySimilar(query, topK, sessionId);

        // 2. Generate answer using Gemini
        const answer = await generateAnswer(query, retrievedChunks);

        res.json({
            query,
            answer,
            retrievedChunks: retrievedChunks.map((c) => ({
                id: c.id,
                text: c.text,
                score: c.score,
                startIndex: c.startIndex,
                endIndex: c.endIndex,
            })),
        });
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
