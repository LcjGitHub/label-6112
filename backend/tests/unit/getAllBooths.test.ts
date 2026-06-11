import { getAllBooths } from "../../src/db";
import { seedTestBooths } from "../helpers/seed";

describe("getAllBooths", () => {
  beforeEach(() => {
    seedTestBooths();
  });

  describe("城市筛选", () => {
    it("应返回指定城市的电话亭", () => {
      const result = getAllBooths("北京");
      expect(result.total).toBe(5);
      expect(result.data.every((b) => b.city === "北京")).toBe(true);
    });

    it("城市筛选不区分空值", () => {
      const result = getAllBooths(undefined);
      expect(result.total).toBe(25);
    });

    it("不存在的城市应返回空数组", () => {
      const result = getAllBooths("南京");
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe("状态筛选", () => {
    it("应返回指定状态的电话亭", () => {
      const result = getAllBooths(undefined, "available");
      expect(result.total).toBe(15);
      expect(result.data.every((b) => b.status === "available")).toBe(true);
    });

    it("应返回 damaged 状态的电话亭", () => {
      const result = getAllBooths(undefined, "damaged");
      expect(result.total).toBe(5);
      expect(result.data.every((b) => b.status === "damaged")).toBe(true);
    });

    it("应返回 demolished 状态的电话亭", () => {
      const result = getAllBooths(undefined, "demolished");
      expect(result.total).toBe(5);
      expect(result.data.every((b) => b.status === "demolished")).toBe(true);
    });
  });

  describe("城市与状态组合筛选", () => {
    it("应同时按城市和状态筛选", () => {
      const result = getAllBooths("北京", "available");
      expect(result.total).toBe(3);
      expect(result.data.every((b) => b.city === "北京" && b.status === "available")).toBe(true);
    });

    it("组合筛选无匹配时返回空", () => {
      const result = getAllBooths("杭州", "damaged");
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe("地址关键词模糊匹配", () => {
    it("应匹配地址中包含关键词的电话亭", () => {
      const result = getAllBooths(undefined, undefined, "王府井");
      expect(result.total).toBe(1);
      expect(result.data[0].address).toContain("王府井");
    });

    it("关键词应支持部分匹配", () => {
      const result = getAllBooths(undefined, undefined, "大街");
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.data.every((b) => b.address.includes("大街"))).toBe(true);
    });

    it("空关键词应返回全部结果", () => {
      const result = getAllBooths(undefined, undefined, "");
      expect(result.total).toBe(25);
    });

    it("仅含空格的关键词应返回全部结果", () => {
      const result = getAllBooths(undefined, undefined, "   ");
      expect(result.total).toBe(25);
    });

    it("关键词不匹配时返回空", () => {
      const result = getAllBooths(undefined, undefined, "不存在的地址");
      expect(result.total).toBe(0);
    });

    it("关键词应与城市筛选组合使用", () => {
      const result = getAllBooths("上海", undefined, "南京东路");
      expect(result.total).toBe(1);
      expect(result.data[0].city).toBe("上海");
      expect(result.data[0].address).toContain("南京东路");
    });
  });

  describe("分页功能", () => {
    it("默认应返回第1页，每页10条", () => {
      const result = getAllBooths();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.data.length).toBe(10);
    });

    it("应支持指定页码", () => {
      const result = getAllBooths(undefined, undefined, undefined, 2, 10);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.data.length).toBe(10);
    });

    it("每页大小只允许 10、20、50，非法值默认10", () => {
      const result1 = getAllBooths(undefined, undefined, undefined, 1, 5);
      expect(result1.pageSize).toBe(10);

      const result2 = getAllBooths(undefined, undefined, undefined, 1, 100);
      expect(result2.pageSize).toBe(10);

      const result3 = getAllBooths(undefined, undefined, undefined, 1, 20);
      expect(result3.pageSize).toBe(20);

      const result4 = getAllBooths(undefined, undefined, undefined, 1, 50);
      expect(result4.pageSize).toBe(50);
    });

    it("页码应为正整数，0或负数默认第1页", () => {
      const result1 = getAllBooths(undefined, undefined, undefined, 0, 10);
      expect(result1.page).toBe(1);

      const result2 = getAllBooths(undefined, undefined, undefined, -1, 10);
      expect(result2.page).toBe(1);
    });

    it("页码为小数时应向下取整", () => {
      const result = getAllBooths(undefined, undefined, undefined, 1.7, 10);
      expect(result.page).toBe(1);
    });
  });

  describe("页码超出总页数时自动校正", () => {
    it("页码大于总页数时应校正为最后一页", () => {
      const result = getAllBooths(undefined, undefined, undefined, 100, 10);
      expect(result.page).toBe(3);
      expect(result.data.length).toBe(5);
    });

    it("空数据集时页码应为1", () => {
      const result = getAllBooths("不存在的城市", undefined, undefined, 5, 10);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.data).toEqual([]);
    });

    it("刚好最后一页时正常返回", () => {
      const result = getAllBooths(undefined, undefined, undefined, 3, 10);
      expect(result.page).toBe(3);
      expect(result.data.length).toBe(5);
    });

    it("pageSize=20时最后一页应返回5条", () => {
      const result = getAllBooths(undefined, undefined, undefined, 2, 20);
      expect(result.page).toBe(2);
      expect(result.data.length).toBe(5);
    });
  });

  describe("返回结构", () => {
    it("应返回正确的分页结构", () => {
      const result = getAllBooths();
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.pageSize).toBe("number");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("total 应为符合条件的总数而非当前页数量", () => {
      const result = getAllBooths(undefined, undefined, undefined, 1, 10);
      expect(result.total).toBe(25);
      expect(result.data.length).toBe(10);
    });
  });
});
