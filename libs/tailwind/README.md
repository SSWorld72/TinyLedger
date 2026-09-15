# Tailwind CSS (Standalone Script)

## 簡介
Tailwind CSS 是一個 Utility-first 的 CSS 框架，讓您可以直接在 HTML 標籤內套用各種工具類別來快速排版。
這裡存放的是 Tailwind 的獨立瀏覽器腳本（Play CDN 版本），它可以在瀏覽器執行階段直接掃描 HTML 並產生所需的 CSS。

- **官方網站**: [https://tailwindcss.com/](https://tailwindcss.com/)

## 為什麼放在這裡？
為了確保專案擁有 **100% 的 PWA 離線可用性**。
如果我們使用官方 CDN 引入（例如 `https://cdn.tailwindcss.com`），當使用者在沒有網路的環境下開啟 App 時，版面就會因為讀不到 CSS 腳本而嚴重跑版。
因此我們將腳本下載到本地端 `libs/tailwind/` 中，讓它與我們的程式碼綁在一起，達到完全離線運作的能力。

## 檔案說明
- `tailwindcss.js`: 核心腳本，負責在瀏覽器載入時即時解析並生成樣式。

## 如何使用
只要在 `index.html` 的 `<head>` 中引入即可：

```html
<script src="libs/tailwind/tailwindcss.js"></script>
```

## 為什麼不使用 npm / PostCSS 建置？
本專案的設計理念是「極簡」與「純前端 (Serverless)」，不依賴任何 Node.js 等後端建置工具。
使用 Standalone Script 雖然會讓檔案稍微大一點（約數百 KB），但能徹底免除繁瑣的環境設定與編譯流程，讓任何人只要點開 `index.html` 就能開始開發。
