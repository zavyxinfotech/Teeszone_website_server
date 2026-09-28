// dotenv must load before Config reads process.env.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");
dotenv.config();

import Formatter from "../utils/formatter";
import Config from "./config";

const config = new Config(process.env);
const fmt = new Formatter();

export { config, fmt };
