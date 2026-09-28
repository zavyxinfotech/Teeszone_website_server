import { ErrorParams } from "../interface/error.interface";
import { HttpException } from "./http.exception";

export class BadRequestException extends HttpException {
  constructor(params: Pick<ErrorParams, "data" | "message" | "description">) {
    super({ ...params, status: 400, code: "E400" });
  }
}
