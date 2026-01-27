
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiToken?: string;
    roles?: string[];
  }
  interface User {
    apiToken?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    roles?: string[];
  }
}
