import { Request, Response, NextFunction } from 'express';

export class ErrorHandler extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const handleError = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
  const { statusCode = 500, message } = err;
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Not Found'
  });
};
