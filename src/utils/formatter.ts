export default class Formatter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatError = (error: any) => {
    return {
      status: error.status || 500,
      message: error.message || "Something went wrong",
      data: error.data ?? null,
      success: false as const,
      code: error.code || "E500",
      description: error.description || "Unexpected error occurred. Try again!",
    };
  };

  formatResponse = (result: unknown, message = "", code = "S200") => {
    return {
      data: result,
      message,
      success: true as const,
      code,
    };
  };
}
