import { ErrorParams } from "../interface/error.interface";
import { HttpException } from "./http.exception";

export class CustomException extends HttpException {
  constructor(params: ErrorParams) {
    super(params);
  }
}
