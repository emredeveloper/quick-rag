import { initRAG } from "javascript-ai";

async function main() {
  // Initialize the RAG model with Ollama provider
  const rag = await initRAG({
    provider: "ollama",
    config: {
      embedding_model: "embeddinggemma:latest",
      llm_model: "granite4:3b",
    },
  });

  console.log("Adding PDF documents to the knowledge base...");
  // Add PDF documents from the specified folder
  await rag.addPDFs("./quickstart/PDF");
  console.log("PDF documents added successfully.");

  // Ask a question based on the content of the PDF documents
  const question = "What are the key findings of these papers?";
  console.log(`
Asking: ${question}`);

  const response = await rag.chat(question);
  console.log("Response:", response);
}

main();