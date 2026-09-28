import { ErrorParams } from "../interface/error.interface";

export class HttpException extends Error {
  public status = 500;
  public message = "Something went wrong";
  public code = "E500";
  public data: unknown = null;
  public success = false;
  public description = "Unexpected error occurred. Try again!";

  constructor(params: ErrorParams) {
    super(params.message || "Something went wrong");
    if (params.status) this.status = params.status;
    if (params.message) this.message = params.message;
    if (params.code) this.code = params.code;
    if (params.data !== undefined) this.data = params.data;
    if (params.description) this.description = params.description;
  }
}
