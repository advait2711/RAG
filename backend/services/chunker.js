/**
 * Three chunking strategies for RAG:
 * 1. Fixed-size — equal character-length chunks
 * 2. Overlapping — fixed-size with sliding window overlap
 * 3. Recursive — split hierarchically by separators
 */

/**
 * Fixed-size chunking: splits text into equal-length chunks.
 * @param {string} text - The source text
 * @param {number} chunkSize - Characters per chunk (default 500)
 * @returns {Array<{id: number, text: string, startIndex: number, endIndex: number}>}
 */
export function fixedSizeChunk(text, chunkSize = 500) {
    const chunks = [];
    let id = 0;

    for (let i = 0; i < text.length; i += chunkSize) {
        const chunkText = text.slice(i, i + chunkSize);
        chunks.push({
            id: id++,
            text: chunkText,
            startIndex: i,
            endIndex: Math.min(i + chunkSize, text.length),
        });
    }

    return chunks;
}

/**
 * Overlapping chunking: fixed-size with a sliding window overlap.
 * @param {string} text - The source text
 * @param {number} chunkSize - Characters per chunk (default 500)
 * @param {number} overlap - Overlap characters between chunks (default 100)
 * @returns {Array<{id: number, text: string, startIndex: number, endIndex: number}>}
 */
export function overlappingChunk(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    let id = 0;
    const step = chunkSize - overlap;

    if (step <= 0) {
        throw new Error("Overlap must be smaller than chunk size.");
    }

    for (let i = 0; i < text.length; i += step) {
        const chunkText = text.slice(i, i + chunkSize);
        chunks.push({
            id: id++,
            text: chunkText,
            startIndex: i,
            endIndex: Math.min(i + chunkSize, text.length),
        });

        // Stop if we've reached the end of the text
        if (i + chunkSize >= text.length) break;
    }

    return chunks;
}

/**
 * Recursive chunking: split by separators hierarchically.
 * Tries to split by double newline, then single newline, then sentence, then space.
 * @param {string} text - The source text
 * @param {number} chunkSize - Max characters per chunk (default 500)
 * @param {string[]} separators - Ordered list of separators to try
 * @returns {Array<{id: number, text: string, startIndex: number, endIndex: number}>}
 */
export function recursiveChunk(
    text,
    chunkSize = 500,
    separators = ["\n\n", "\n", ". ", " "]
) {
    const results = [];
    let globalId = 0;

    function _recursiveSplit(inputText, startOffset, seps) {
        // Base case: text fits in a single chunk
        if (inputText.length <= chunkSize) {
            if (inputText.trim().length > 0) {
                results.push({
                    id: globalId++,
                    text: inputText,
                    startIndex: startOffset,
                    endIndex: startOffset + inputText.length,
                });
            }
            return;
        }

        // No separators left — force split at chunkSize
        if (seps.length === 0) {
            for (let i = 0; i < inputText.length; i += chunkSize) {
                const slice = inputText.slice(i, i + chunkSize);
                if (slice.trim().length > 0) {
                    results.push({
                        id: globalId++,
                        text: slice,
                        startIndex: startOffset + i,
                        endIndex: startOffset + Math.min(i + chunkSize, inputText.length),
                    });
                }
            }
            return;
        }

        const sep = seps[0];
        const parts = inputText.split(sep);
        let currentChunk = "";
        let currentStart = startOffset;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const candidate =
                currentChunk.length === 0 ? part : currentChunk + sep + part;

            if (candidate.length <= chunkSize) {
                currentChunk = candidate;
            } else {
                // Flush currentChunk if it has content
                if (currentChunk.trim().length > 0) {
                    if (currentChunk.length <= chunkSize) {
                        results.push({
                            id: globalId++,
                            text: currentChunk,
                            startIndex: currentStart,
                            endIndex: currentStart + currentChunk.length,
                        });
                    } else {
                        // Recurse with remaining separators
                        _recursiveSplit(currentChunk, currentStart, seps.slice(1));
                    }
                }
                currentStart = currentStart + currentChunk.length + sep.length;
                currentChunk = part;
            }
        }

        // Flush remaining
        if (currentChunk.trim().length > 0) {
            if (currentChunk.length <= chunkSize) {
                results.push({
                    id: globalId++,
                    text: currentChunk,
                    startIndex: currentStart,
                    endIndex: currentStart + currentChunk.length,
                });
            } else {
                _recursiveSplit(currentChunk, currentStart, seps.slice(1));
            }
        }
    }

    _recursiveSplit(text, 0, separators);
    return results;
}

/**
 * Compute statistics for a set of chunks.
 */
export function getChunkStats(chunks) {
    if (chunks.length === 0) return { count: 0, avgSize: 0, minSize: 0, maxSize: 0 };

    const sizes = chunks.map((c) => c.text.length);
    const sum = sizes.reduce((a, b) => a + b, 0);

    return {
        count: chunks.length,
        avgSize: Math.round(sum / sizes.length),
        minSize: Math.min(...sizes),
        maxSize: Math.max(...sizes),
    };
}
