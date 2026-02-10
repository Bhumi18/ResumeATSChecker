import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("account", "routes/account.tsx"),
  route("upload", "routes/upload.tsx"),
  route("analyze/:id", "routes/analyze.$id.tsx"),
  route("api/resumes", "routes/api.resumes.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
  route("api/analyze", "routes/api.analyze.tsx"),
  route("api/test-db", "routes/api.test-db.tsx"),
  route("api/auth/signup", "routes/api.auth.signup.tsx"),
  route("api/auth/signin", "routes/api.auth.signin.tsx"),
  route("api/auth/signout", "routes/api.auth.signout.tsx"),
  route("api/auth/me", "routes/api.auth.me.tsx"),
  route("api/auth/update-profile", "routes/api.auth.update-profile.tsx"),
  route("api/migrate-auth", "routes/api.migrate-auth.tsx"),
] satisfies RouteConfig;
