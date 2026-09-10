import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ success: false, message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  if (error?.name === "ValidationError") return response.status(400).json({ success: false, message: "Validation failed", errors: Object.values(error.errors || {}).map((item) => { const detail = item as { path?: string; message?: string }; return { field: detail.path, message: detail.message }; }) });
  if (error?.code === 11000) return response.status(409).json({ success: false, message: "A record with these values already exists" });
  if (error?.name === "CastError") return response.status(400).json({ success: false, message: "Invalid resource id" });
  response.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal server error" });
};
