# Cropper.js

## 簡介
Cropper.js 是一個強大的 JavaScript 圖片裁切開源套件，支援觸控手勢（雙指縮放、單指拖曳）、旋轉、比例限制等進階功能。

- **官方網站 / GitHub**: [https://fengyuanchen.github.io/cropperjs/](https://fengyuanchen.github.io/cropperjs/)
- **目前版本**: v1.6.1

## 為什麼放在這裡？
為了讓專案維持 100% 的 **PWA 離線可用性**，我們不使用 CDN 引入，而是將編譯後的核心檔案下載並存放於此 `libs/cropper/` 目錄中，確保在無網路環境下依然能正常執行照片裁切功能。

## 檔案說明
- `cropper.min.css` : 裁切視窗所需的基礎樣式檔。
- `cropper.min.js` : 裁切功能的核心邏輯。

## 如何使用
在 `index.html` 中引入以下檔案：

```html
<!-- 在 <head> 中引入 CSS -->
<link rel="stylesheet" href="libs/cropper/cropper.min.css">

<!-- 在 <body> 底部引入 JS -->
<script src="libs/cropper/cropper.min.js"></script>
```

## 更新方式
若未來需要更新版本，請前往 [cdnjs - cropperjs](https://cdnjs.com/libraries/cropperjs) 或官方 GitHub 下載對應版本的 `.min.css` 與 `.min.js`，直接覆蓋本目錄下的同名檔案即可。
