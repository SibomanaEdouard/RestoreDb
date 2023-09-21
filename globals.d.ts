declare module "jsonwebtoken";
declare module "bcryptjs";
declare module "geoip-lite";
declare namespace Express {
  export interface Request {
    db: any;
  }
}
