import request from "supertest";
import { createApp } from "../../src/index";
import { seedTestBooths } from "../helpers/seed";

const app = createApp();

describe("GET /api/booths - 电话亭列表查询接口", () => {
  beforeEach(() => {
    seedTestBooths();
  });

  describe("基础查询", () => {
    it("应返回 200 状态码和分页数据", async () => {
      const res = await request(app).get("/api/booths");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("pageSize");
    });

    it("默认返回第1页，每页10条", async () => {
      const res = await request(app).get("/api/booths");
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.data.length).toBe(10);
      expect(res.body.total).toBe(25);
    });
  });

  describe("城市筛选", () => {
    it("应支持按城市筛选", async () => {
      const res = await request(app).get("/api/booths").query({ city: "北京" });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.data.every((b: { city: string }) => b.city === "北京")).toBe(true);
    });

    it("空城市参数应返回全部", async () => {
      const res = await request(app).get("/api/booths").query({ city: "" });
      expect(res.body.total).toBe(25);
    });
  });

  describe("状态筛选", () => {
    it("应支持按状态筛选", async () => {
      const res = await request(app).get("/api/booths").query({ status: "available" });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(15);
      expect(res.body.data.every((b: { status: string }) => b.status === "available")).toBe(true);
    });
  });

  describe("地址关键词模糊匹配", () => {
    it("应支持关键词模糊搜索", async () => {
      const res = await request(app).get("/api/booths").query({ keyword: "王府井" });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].address).toContain("王府井");
    });

    it("空关键词应返回全部", async () => {
      const res = await request(app).get("/api/booths").query({ keyword: "" });
      expect(res.body.total).toBe(25);
    });
  });

  describe("分页参数", () => {
    it("应支持指定页码", async () => {
      const res = await request(app).get("/api/booths").query({ page: 2, pageSize: 10 });
      expect(res.body.page).toBe(2);
      expect(res.body.data.length).toBe(10);
    });

    it("pageSize 只允许 10、20、50，非法值默认 10", async () => {
      const res1 = await request(app).get("/api/booths").query({ pageSize: 5 });
      expect(res1.body.pageSize).toBe(10);

      const res2 = await request(app).get("/api/booths").query({ pageSize: 100 });
      expect(res2.body.pageSize).toBe(10);

      const res3 = await request(app).get("/api/booths").query({ pageSize: 20 });
      expect(res3.body.pageSize).toBe(20);
    });

    it("非数字页码默认第1页", async () => {
      const res = await request(app).get("/api/booths").query({ page: "abc" });
      expect(res.body.page).toBe(1);
    });
  });

  describe("页码超出总页数自动校正", () => {
    it("页码大于总页数时应校正为最后一页", async () => {
      const res = await request(app).get("/api/booths").query({ page: 999, pageSize: 10 });
      expect(res.body.page).toBe(3);
      expect(res.body.data.length).toBe(5);
    });
  });

  describe("组合查询", () => {
    it("应支持城市 + 状态 + 关键词组合查询", async () => {
      const res = await request(app)
        .get("/api/booths")
        .query({ city: "北京", status: "available", keyword: "大街" });
      expect(res.status).toBe(200);
      expect(res.body.data.every((b: { city: string; status: string; address: string }) =>
        b.city === "北京" && b.status === "available" && b.address.includes("大街")
      )).toBe(true);
    });
  });
});
