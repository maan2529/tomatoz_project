// change in fastify

export const validatePipelineRequest = (req, res, next) => {
  const { tech, maxSources, recencyDays } = req.body;

  if (!tech || typeof tech !== 'string') {
    return res.status(400).json({
      error: 'Valid technology name (string) is required'
    });
  }

  if (maxSources && (typeof maxSources !== 'number' || maxSources < 1 || maxSources > 10)) {
    return res.status(400).json({
      error: 'maxSources must be a number between 1 and 10'
    });
  }

  if (recencyDays && (typeof recencyDays !== 'number' || recencyDays < 1 || recencyDays > 365)) {
    return res.status(400).json({
      error: 'recencyDays must be a number between 1 and 365'
    });
  }

  next();
};

export const validateApiKeys = (req, res, next) => {
  if (!process.env.TAVILY_API_KEY || !process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'API keys not configured'
    });
  }
  next();
};
