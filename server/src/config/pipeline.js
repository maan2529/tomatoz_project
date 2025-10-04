export const pipelineConfig = {
  maxSources: 5,
  recencyDays: 90,
  slugCollisionStrategy: "append-hash",
  requestDelay: 1000,
  maxRetries: 3
};

export const apiConfig = {
  tavily: {
    maxResults: 10,
    searchDepth: "advanced"
  },
  gemini: {
    model: "gemini-2.0-flash",
    temperature: 0.1
  }
};