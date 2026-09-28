import { cleanEnv, num, port, str } from "envalid";

export default class Config {
  public env: "development" | "production" | "test";
  public port: number;

  public database_url: string;
  public database_host: string;
  public database_port: number;
  public database_name: string;
  public database_username: string;
  public database_password: string;

  public jwt_secret: string;
  public admin_emails: string[];
  public cors_origins: string[];
  public redis_url: string;
  public google_client_id: string;
  public frontend_url: string;

  public resend_api_key: string;
  public mail_from: string;
  public enquiry_notify_email: string;

  public aws_access_key_id: string;
  public aws_secret_access_key: string;
  public aws_region: string;
  public s3_bucket_name: string;
  public s3_endpoint: string;

  constructor(env: NodeJS.ProcessEnv) {
    const e = cleanEnv(env, {
      NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
      PORT: port({ default: 4010 }),

      DATABASE_URL: str(),
      DB_HOST: str({ default: "localhost" }),
      DB_PORT: num({ default: 3306 }),
      DB_NAME: str({ default: "teeszone" }),
      DB_USERNAME: str(),
      DB_PASSWORD: str(),

      JWT_SECRET: str(),
      ADMIN_EMAILS: str(),
      CORS_ORIGINS: str({ default: "http://localhost:3000" }),
      REDIS_URL: str({ default: "redis://localhost:6379" }),
      GOOGLE_CLIENT_ID: str({ devDefault: "" }), // Google sign-in returns 503 until set
      FRONTEND_URL: str({ default: "http://localhost:3000" }), // password-reset links

      RESEND_API_KEY: str({ devDefault: "" }),
      MAIL_FROM: str({ default: "TeesZone <no-reply@teeszone.in>" }),
      ENQUIRY_NOTIFY_EMAIL: str({ devDefault: "" }),

      AWS_ACCESS_KEY_ID: str({ devDefault: "" }),
      AWS_SECRET_ACCESS_KEY: str({ devDefault: "" }),
      AWS_REGION: str({ default: "ap-south-1" }),
      S3_BUCKET_NAME: str({ devDefault: "" }),
      S3_ENDPOINT: str({ devDefault: "" }),
    });

    this.env = e.NODE_ENV;
    this.port = e.PORT;

    this.database_url = e.DATABASE_URL;
    this.database_host = e.DB_HOST;
    this.database_port = e.DB_PORT;
    this.database_name = e.DB_NAME;
    this.database_username = e.DB_USERNAME;
    this.database_password = e.DB_PASSWORD;

    this.jwt_secret = e.JWT_SECRET;
    this.admin_emails = e.ADMIN_EMAILS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    this.cors_origins = e.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
    this.redis_url = e.REDIS_URL;
    this.google_client_id = e.GOOGLE_CLIENT_ID;
    this.frontend_url = e.FRONTEND_URL.replace(/\/$/, "");

    this.resend_api_key = e.RESEND_API_KEY;
    this.mail_from = e.MAIL_FROM;
    this.enquiry_notify_email = e.ENQUIRY_NOTIFY_EMAIL;

    this.aws_access_key_id = e.AWS_ACCESS_KEY_ID;
    this.aws_secret_access_key = e.AWS_SECRET_ACCESS_KEY;
    this.aws_region = e.AWS_REGION;
    this.s3_bucket_name = e.S3_BUCKET_NAME;
    this.s3_endpoint = e.S3_ENDPOINT;
  }
}
