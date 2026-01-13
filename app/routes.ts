import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("sso-callback", "routes/sso-callback.tsx"),
  route("account", "routes/account.tsx"),
] satisfies RouteConfig;
