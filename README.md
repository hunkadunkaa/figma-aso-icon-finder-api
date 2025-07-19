# gplay-figma-icon-finder-api

## Giới thiệu

Repo serverless API sử dụng cho plugin [gplay-figma-icon-finder](https://github.com/hunkadunkaa/gplay-figma-icon-finder) được triển khai trên nền tảng [Vercel](https://vercel.com/) và dùng để giao tiếp giữa plugin Figma và Google Play Store, giúp lấy thông tin icon ứng dụng một cách tự động.

API sử dụng thư viện [google-play-scraper](https://github.com/facundoolano/google-play-scraper) để truy vấn và lấy dữ liệu icon, tên ứng dụng, nhà phát triển từ Google Play Store.

## Tính năng

- Nhận request từ plugin Figma (hoặc client khác) để tìm kiếm ứng dụng trên Google Play Store.
- Trả về danh sách ứng dụng phù hợp với từ khóa, bao gồm: appId, tên, icon, tên nhà phát triển.
- Hỗ trợ giới hạn số lượng kết quả và chọn quốc gia tìm kiếm.

## Cách sử dụng

### 1. Triển khai trên Vercel

- Clone repo này về máy.
- Đảm bảo đã cài đặt [Vercel CLI](https://vercel.com/docs/cli).
- Đặt biến môi trường `FIGMA_PLUGIN_API_KEY` trong dashboard Vercel hoặc file `.env`
- Deploy lên Vercel bằng lệnh:
  ```sh
  vercel --prod

### 2. Gọi API
* Endpoint: `https://<your-vercel-domain>/api`
* Method: `GET`
* Header:
    * `x-api-key`: API Key bạn đã cấu hình
* Query params:
    * `term`: Từ khóa tìm kiếm (bắt buộc)
    * `country`: Mã quốc gia (mặc định: us)
    * `limit`: Số lượng kết quả (mặc định: 5)


Ví dụ:
GET https://<your-vercel-domain>/api?term=facebook&country=vn&limit=5
Headers:
  x-api-key: <your-api-key>


### 3. Response

{
  "data": [
    {
      "appId": "com.facebook.katana",
      "title": "Facebook",
      "icon": "https://play-lh.googleusercontent.com/...",
      "developer": "Meta Platforms, Inc."
    },
    ...
  ]
}

## Công nghệ sử dụng
* [Node.js 20.x](https://nodejs.org/)
* [google-play-scraper](https://github.com/facundoolano/google-play-scraper)
* [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

