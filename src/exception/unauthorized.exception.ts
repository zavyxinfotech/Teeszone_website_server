import { ErrorParams } from "../interface/error.interface";
import { HttpException } from "./http.exception";

export class UnauthorizedException extends HttpException {
  constructor(params: Pick<ErrorParams, "data" | "message" | "description">) {
    super({ ...params, status: 401, code: "E401" });
  }
}
