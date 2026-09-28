import { ErrorParams } from "../interface/error.interface";
import { HttpException } from "./http.exception";

export class NotFoundException extends HttpException {
  constructor(params: Pick<ErrorParams, "data" | "message" | "description">) {
    super({ ...params, status: 404, code: "E404" });
  }
}
