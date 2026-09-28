import { Kysely, MysqlDialect, ParseJSONResultsPlugin } from "kysely";
import { createPool } from "mysql2";
import { DB } from "../../kysely/types";
import { config } from "../config";

const dialect = new MysqlDialect({
  pool: createPool({
    database: config.database_name,
    host: config.database_host,
    user: config.database_username,
    password: config.database_password,
    port: config.database_port,
    connectionLimit: 10,
    timezone: "Z",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,
});

export const db: Kysely<DB> = new Kysely<DB>({
  dialect,
  plugins: [new ParseJSONResultsPlugin()],
});
