import { createBooth } from "../../src/db";
import { BoothInput } from "../../src/types";

export const TEST_BOOTHS: BoothInput[] = [
  { city: "北京", address: "东城区王府井大街88号", longitude: 116.4174, latitude: 39.9092, status: "available", discovery_date: "2024-03-15", photo_url: "https://example.com/photo1.jpg", remark: "测试电话亭1" },
  { city: "北京", address: "西城区西单北大街120号", longitude: 116.3735, latitude: 39.9133, status: "damaged", discovery_date: "2024-05-20", photo_url: "https://example.com/photo2.jpg", remark: "测试电话亭2" },
  { city: "北京", address: "朝阳区建国路88号", longitude: 116.4602, latitude: 39.9091, status: "available", discovery_date: "2024-04-10", photo_url: "https://example.com/photo9.jpg", remark: "测试电话亭9" },
  { city: "北京", address: "海淀区中关村大街1号", longitude: 116.3176, latitude: 39.9836, status: "available", discovery_date: "2024-02-28", photo_url: "https://example.com/photo10.jpg", remark: "测试电话亭10" },
  { city: "北京", address: "丰台区丰台路5号", longitude: 116.2869, latitude: 39.8587, status: "demolished", discovery_date: "2023-10-15", photo_url: "https://example.com/photo11.jpg", remark: "测试电话亭11" },
  { city: "上海", address: "黄浦区南京东路100号", longitude: 121.4844, latitude: 31.2359, status: "available", discovery_date: "2024-06-08", photo_url: "https://example.com/photo3.jpg", remark: "测试电话亭3" },
  { city: "上海", address: "浦东新区陆家嘴环路1000号", longitude: 121.5045, latitude: 31.2397, status: "demolished", discovery_date: "2023-11-30", photo_url: "https://example.com/photo4.jpg", remark: "测试电话亭4" },
  { city: "上海", address: "徐汇区衡山路10号", longitude: 121.4375, latitude: 31.2001, status: "available", discovery_date: "2024-05-05", photo_url: "https://example.com/photo12.jpg", remark: "测试电话亭12" },
  { city: "上海", address: "静安区南京西路1266号", longitude: 121.4555, latitude: 31.2304, status: "damaged", discovery_date: "2024-07-12", photo_url: "https://example.com/photo13.jpg", remark: "测试电话亭13" },
  { city: "上海", address: "长宁区延安西路2000号", longitude: 121.4001, latitude: 31.2134, status: "available", discovery_date: "2024-03-22", photo_url: "https://example.com/photo14.jpg", remark: "测试电话亭14" },
  { city: "广州", address: "越秀区北京路168号", longitude: 113.2644, latitude: 23.1291, status: "available", discovery_date: "2024-07-10", photo_url: "https://example.com/photo5.jpg", remark: "测试电话亭5" },
  { city: "广州", address: "天河区天河路385号", longitude: 113.3256, latitude: 23.1356, status: "damaged", discovery_date: "2024-08-15", photo_url: "https://example.com/photo6.jpg", remark: "测试电话亭6" },
  { city: "广州", address: "海珠区新港东路1000号", longitude: 113.3612, latitude: 23.1022, status: "available", discovery_date: "2024-06-18", photo_url: "https://example.com/photo15.jpg", remark: "测试电话亭15" },
  { city: "广州", address: "荔湾区上下九步行街66号", longitude: 113.2335, latitude: 23.1256, status: "demolished", discovery_date: "2023-09-20", photo_url: "https://example.com/photo16.jpg", remark: "测试电话亭16" },
  { city: "广州", address: "白云区机场路1号", longitude: 113.2689, latitude: 23.1856, status: "available", discovery_date: "2024-04-30", photo_url: "https://example.com/photo17.jpg", remark: "测试电话亭17" },
  { city: "深圳", address: "福田区深南大道5001号", longitude: 114.0579, latitude: 22.5431, status: "available", discovery_date: "2024-09-01", photo_url: "https://example.com/photo7.jpg", remark: "测试电话亭7" },
  { city: "深圳", address: "南山区科技园南路1号", longitude: 113.9501, latitude: 22.5411, status: "demolished", discovery_date: "2023-12-20", photo_url: "https://example.com/photo8.jpg", remark: "测试电话亭8" },
  { city: "深圳", address: "罗湖区东门中路2000号", longitude: 114.1312, latitude: 22.5478, status: "available", discovery_date: "2024-05-15", photo_url: "https://example.com/photo18.jpg", remark: "测试电话亭18" },
  { city: "深圳", address: "宝安区新湖路99号", longitude: 113.8834, latitude: 22.5623, status: "damaged", discovery_date: "2024-08-03", photo_url: "https://example.com/photo19.jpg", remark: "测试电话亭19" },
  { city: "深圳", address: "龙岗区龙翔大道8000号", longitude: 114.2467, latitude: 22.7221, status: "available", discovery_date: "2024-07-07", photo_url: "https://example.com/photo20.jpg", remark: "测试电话亭20" },
  { city: "成都", address: "锦江区春熙路1号", longitude: 104.0819, latitude: 30.6532, status: "available", discovery_date: "2024-06-01", photo_url: "https://example.com/photo21.jpg", remark: "测试电话亭21" },
  { city: "成都", address: "青羊区宽窄巷子50号", longitude: 104.0512, latitude: 30.6723, status: "damaged", discovery_date: "2024-07-25", photo_url: "https://example.com/photo22.jpg", remark: "测试电话亭22" },
  { city: "成都", address: "武侯区人民南路三段1号", longitude: 104.0756, latitude: 30.6421, status: "available", discovery_date: "2024-05-10", photo_url: "https://example.com/photo23.jpg", remark: "测试电话亭23" },
  { city: "杭州", address: "西湖区北山街1号", longitude: 120.1356, latitude: 30.2678, status: "available", discovery_date: "2024-04-15", photo_url: "https://example.com/photo24.jpg", remark: "测试电话亭24" },
  { city: "杭州", address: "上城区延安路100号", longitude: 120.1689, latitude: 30.2789, status: "demolished", discovery_date: "2023-11-10", photo_url: "https://example.com/photo25.jpg", remark: "测试电话亭25" },
];

export function seedTestBooths(): void {
  for (const booth of TEST_BOOTHS) {
    createBooth(booth);
  }
}
