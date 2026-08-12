import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error Details:", err);
  const status = err.status || 500;
  const message = status === 500 ? "Internal Server Error" : err.message;
  // Never leak secrets or raw stacks to client
  res.status(status).json({
    error: {
      message,
      code: err.code || "UNKNOWN_ERROR",
      requestId: req.headers["x-request-id"] || "req-" + Date.now()
    }
  });
};
