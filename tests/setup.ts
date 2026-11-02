process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://cinevide:cinevide_dev@localhost:54322/cinevide_test";
process.env.AUTH_SESSION_COOKIE = "cinevide_session";
process.env.AUTH_SESSION_TTL_DAYS = "30";
process.env.AUTH_SESSION_SECURE = "false";
