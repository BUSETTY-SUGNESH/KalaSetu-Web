type LogMeta = Record<string, unknown>;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
};

export const logError = (scope: string, error: unknown, meta?: LogMeta) => {
  const payload = {
    scope,
    error: serializeError(error),
    ...(meta ? { meta } : {}),
  };

  console.error('[KalaSetu][Error]', payload);
};
