import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Parse an uploaded file buffer and extract its text content.
 * Supports .txt and .pdf files.
 * @param {Buffer} buffer - The file buffer from multer memory storage
 * @param {string} ext - The file extension (e.g. ".pdf", ".txt")
 * @returns {Promise<string>} Extracted text content
 */
export async function parseDocument(buffer, ext) {
  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
    const data = await pdfParse(buffer);

    if (data.numpages > 10) {
      throw new Error(`PDF has ${data.numpages} pages. Maximum 10 pages allowed.`);
    }

    return data.text;
  }

  throw new Error(`Unsupported file type: ${ext}. Only .txt and .pdf are supported.`);
}
