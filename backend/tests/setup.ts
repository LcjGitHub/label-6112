import { setDatabase } from "../src/db";
import Database from "better-sqlite3";

beforeEach(() => {
  const testDb = new Database(":memory:");
  setDatabase(testDb);
});
