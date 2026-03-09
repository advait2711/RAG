# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

Built a full-stack RAG (Retrieval-Augmented Generation) Visualizer using React, Express, Pinecone, and Google Gemini that lets users upload documents and interactively explore the chunking, embedding, and retrieval pipeline through a guided step-by-step UI.

Implemented 3 text chunking strategies (fixed-size, overlapping, and recursive) with real-time chunk inspection, and integrated Pinecone's vector database with its native embedding model (llama-text-embed-v2) for semantic search and document retrieval.

Deployed as a single-service architecture on AWS App Runner, using in-memory file processing to eliminate filesystem dependencies, with Gemini 2.5 Flash powering context-grounded Q&A over uploaded documents.