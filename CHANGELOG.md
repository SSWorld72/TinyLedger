# TinyLedger - Changelog

> 🇹🇼 若要查看繁體中文版，請參閱 [CHANGELOG.zh-TW.md](CHANGELOG.zh-TW.md)

## 2026-09-15 (v1.5.6.0 - 5 New Languages & Cache Fix)
### Added
- **Support More Languages**: Added 7 display languages: Simplified Chinese, Japanese, Korean, Thai, Hindi, French, and German.

### Fixes
- **Language Cache Exception Fix**: Fixed an issue where browser caching prevented some users from seeing the newly added language options in the list.

---

## 2026-09-15 (v1.5.5.0 - Interface Fixation & Layout Consistency Optimization)
### Fixes
- **Interface Fixation Fix**: Fixed the issue where the top control panel and category bar could not be properly fixed at the top of the screen when scrolling. Now, whether in the "General Records" or "Statistics Charts", the top menu can be perfectly fixed.
- **Mobile and Desktop Layout Dislocation**: Fixed inconsistent issues where fonts and layouts would jump on some pages under tablet sizes.

### Added
- **Custom Pagination Count**: Added a "Records Per Page" selector on the list page, allowing you to freely switch how many records you want to view at once.

---

## 2026-09-14 (v1.5.4.0 - Cloud Sync Performance & Restore Logic Fixes)
### Fixes
- **Cloud Sync Exception Fix**: Fixed a read gap exception caused by the final consistency of Google Drive when data is split and uploaded due to large sizes. The single transmission limit has now been significantly increased to 20MB, allowing the vast majority of backups to be completed at once.
- **Merge Restore Account Retention Fix**: When using "Merge Restore", if a local account with the same ID (e.g., default account) exists, the custom name and settings from the cloud backup will now be correctly overwritten back instead of being directly skipped.
- **Clear Data Security Protection**: When executing "Force Clear Local Data", the system will automatically protect and retain your Google Maps API Key and GAS Private Cloud settings to prevent the loss of important keys.

### Improvements
- **Auto-Sync Queuing Mechanism**: If new data changes occur during background sync execution, the system will automatically queue the request to ensure no omissions occur when continuously adding data.

---

## 2026-09-11 (v1.5.3.0 - Backup/Restore Completeness Fix)
### Fixes
- **More Complete Backup**: Backup files will now simultaneously save the display language settings, preventing the language from being reset after restoration.
- **Smarter Merge Restore**: When restoring using the "Merge" method, existing local accounts and important festival reminders will be correctly retained and no longer accidentally overwritten by data in the backup file; only items present in the backup but not locally will be supplemented.

### Improvements
- **Interface Language Unification**: Fixed the progress text during backup and restoration to ensure English is correctly displayed under the English interface without mixing in Chinese.

---

## 2026-09-10 (v1.5.2.0 - Test Data Generator & Cloud ZIP Backup Upgrade)
### Added
- **Standalone Test Data Generator**: Added the `generate_sample.html` development helper tool, supporting one-click generation of massive and realistic random Chinese and English bookkeeping records (including various categories, multi-accounts, and periodic fixed records), making it easy for new users to preview or developers to test.
- **Random Photo Generation**: The test data generator now supports automatically including multiple real high-resolution (480x320) test receipt/detail fake photos to simulate the file size of a real backup.
- **Test Data Import Link**: Added a "Generate Test Data" quick link in the top right corner of the "Settings > Backup" section.

### Improvements
- **Multi-Line Sync Progress Display**: Added support for a four-line parallel sync progress status panel during local ZIP import and cloud backup/restore, allowing users to instantly grasp the individual writing progress of "General Records", "Fixed Records", "Category Settings", and "Target Settings".
- **Precise Write Counting Mechanism**: Redesigned the underlying IndexedDB writing and progress reporting logic, upgrading the progress jump from batch (Chunk) units to a precise `+1` increment synchronized with each data write, making the restoration progress smoother and more realistic.
- **Private Cloud (GAS) Backup Fully Upgraded to ZIP Compression**: The cloud backup mechanism that previously transmitted giant JSON Base64 directly has been officially upgraded to the "ZIP Text-Image Separation Compression Technology". Now, when backing up to the cloud, the system automatically separates and packages the records and photos into a ZIP locally before encrypting and uploading, significantly reducing the risk of Out of Memory (OOM) on mobile web browsers and shrinking the backup file size.
- **Unified Backup File Format Description**: In response to the full adoption of ZIP compression locally and on the cloud, removed the potentially misleading "(JSON)" text from the UI settings interface and multi-language dictionaries.
- **Environment Refresh After Restore**: Optimized the local ZIP restore flow. After a successful import, the webpage will automatically refresh to ensure all themes, settings, and global variables are correctly applied, keeping consistent with the cloud restore behavior.

## 2026-09-09 (v1.5.1.0 - Mobile UI Optimization & Perpetual Calendar Overlap Fix)
### Fixes
- **Perpetual Calendar Festival Overlap & Layout**: Completely decoupled the underlying Farmer's Almanac module and interface rendering logic, removed the 2/14 festival setting, and unified it under the exclusive "Fun Valentine's Day" switch. Also optimized the display position of "Specific Festivals (Anniversaries)" by moving them below the Bazi chart in the calendar details panel.

### Improvements
- **Mobile Address Input Optimization**: Fixed the issue in the add record dialog where the width of the address search field was overly compressed and text was truncated due to the default padding of the Google Maps component.
- **Anti-Virtual Keyboard Obstruction**: Added a smart focus mechanism. When clicking the address input box on a mobile phone, the screen automatically scrolls smoothly to the very top, ensuring the Google Maps autocomplete dropdown menu is not obstructed by the pop-up virtual keyboard.

## 2026-09-08 (v1.5.0.0 - International Multi-Language Support & Architecture Refactoring)
### Added
- **Multi-Language (i18n) Support**: Fully introduced an internationalized multi-language architecture and added an English interface. Users can instantly switch languages on the settings page, and the UI interface, chart units, built-in categories, and prompt messages can all be automatically translated and converted.
- **UI Modular Loading Mechanism**: Implemented `htmlLoader.js` to completely break down the originally bloated `index.html` into multiple independent Views and Modals, and render them in combination with multi-language dictionaries, greatly improving loading performance and maintainability.

### Improvements
- **Chart & Data Presentation**: Added multi-language support to `charts.js`, converting units like "Ten Thousand / Hundred Million" to "K / M / B" for display.
- **Database Migration Script**: Added `i18nMigration.js` to upgrade the `catId` in old data to the standard multi-language `i18nKey` format.

## 2026-09-03 (v1.4.2.0 - Theme Consistency & Logging Enhancement)
### Added
- **Global Error Log Catching**: The system log panel can now automatically catch unexpected program errors, making troubleshooting easier.

### Improvements
- **Settings Page Theme Sync**: All sections in the settings page (GAS Backup, Google Maps, Photo Settings, System Logs) now perfectly follow the appearance theme color changes.
- **Settings Page Layout Unification**: Unified the spacing and subtitle formats of all setting sections to make them visually neater and more consistent.
- **Log Message Color Differentiation**: Error messages in the system log panel have been changed to red and warnings to yellow for quick identification.
- **Theme Selector Simplification**: The appearance theme dropdown menu only displays the theme names, making the layout cleaner.

### Fixes
- **Backup Version Count Unlock**: Fixed the issue where the "Retain Version Count" dropdown menu in the GAS cloud backup could not be operated.

## 2026-09-02 (v1.4.1.0 - Interface Optimization & Adjustment)
### Improvements
- **About Page Redesign**: Completely redesigned the layout of "About and License Terms", switching to grid cards with highlighted borders to improve readability and establish a unique style.
- **Sponsor Author Button**: Moved the "Sponsor Author" button to the right side of the main title bar on the system settings and about pages, making it easier to click.
- **Data Management Color Adjustment**: Added a secondary color (indigo) to the buttons in "Data Management" to ensure good visual recognition under both dark and light themes.
- **Third-Party Library Information**: Added official links and current version numbers of third-party open-source technologies in the "About" page.
- **Account Dropdown Menu Fix**: Fixed the issue where the background color of the account selection dropdown menu did not change with the theme under the dark theme.

## 2026-09-01 (v1.4.0.0 - Multi-Account Budget & Global Switch)
### Added
- **Multi-Account Budget Support**: Each account can now have its own independent "Monthly Budget". When switching accounts, the progress bar on the homepage will automatically switch to display the corresponding budget quota.
- **Global Budget Dynamic Total**: When selecting "All" accounts on the homepage, the system will automatically sum up the budgets of all accounts as the total quota to help you grasp the overall financial situation.

### Improvements
- **Global Account Switch**: Moved the account switch button from the detail list to the top global header. Now, whether in the details, statistics, or fixed records pages, you can switch and filter account data at any time.
- **Homepage Layout Compression**: Significantly reduced the blank space above and below the "Budget Progress Bar" section on the homepage, freeing up more precious screen space for the bottom record list and enhancing the browsing experience on small screens.

## 2026-08-28 (v1.3.3.0 - Category Linkage & Photo Backup Fix)
### Fixes
- **Category Linkage Update Safeguard**: Fixed a severe error where editing a major category name would accidentally overwrite identically named major categories in different income/expense types (e.g., Income and Expense).
- **Photo Backup Loss Fix**: Fixed the issue where photos could not be correctly converted and extracted to physical image files when generating a ZIP backup file, ensuring all records with photos can be perfectly backed up and restored, while maintaining compatibility with old backup files.

## 2026-08-25 (v1.3.2.0 - Experience Optimization & Layout Fix)
### Improvements
- **List Positioning & Highlighting**: After adding or duplicating a record, the list will automatically scroll and precisely position to that data, and a brief yellow highlight prompt will be added, eliminating the need to manually search for newly added data.

### Fixes
- **Perpetual Calendar Layout Fix**: Fixed the issue where the grid height was forced to be equal when displaying multiple records in the perpetual calendar, resulting in a large amount of blank space. It can now automatically expand and contract elastically based on the daily content amount.
- **iOS Interface Tweaks**: Fine-tuned the date and amount input box proportions in the fixed record settings page, solving the issue of long text being truncated on iOS small screen devices.

## 2026-08-25 (v1.3.1.0 - Interface & Function Fixes)
### Fixes
- **Location Menu Display Exception**: Fixed the issue where the Google Places suggestion menu would automatically pop up and get stuck on the screen when editing a record.
- **iOS Photo Upload Exception**: Solved the issue where clicking the upload button on an iOS device failed to correctly pop up the system's native "Camera/Album" menu.

## 2026-08-24 (v1.3.0.0 - Image Recording & Cropping Feature Upgrade)
### Added
- **Physical Receipt/Invoice Photo Upload**: When adding or editing a record, you can now attach photos by "Taking a Photo" or "Uploading from Album"! This feature supports capturing physical invoices, receipts, or purchased items.
- **Built-In Photo Cropping & Compression**: After uploading a photo, the system will automatically pop up an exquisite cropping tool, allowing you to freely adjust the frame area you want to keep.
- **Quality & Resolution Settings**: Added detailed options for "Photo Resolution" and "Compression Quality" in the settings page, allowing you to strike a perfect balance between "Storage Space" and "Clarity" based on your needs (e.g., increasing quality to preserve receipt text clarity).
- **Cloud/Local Backup Sync Support**: All captured photos are integrated into the existing database structure. Whether using local JSON download or the latest Google Cloud Backup, your precious photos will be automatically backed up and restored!

### Improvements
- **Camera Interface Experience Optimization**: For mobile devices, the rear camera is turned on by default when taking photos, and the photo interface is automatically integrated into the add record form.
- **Edit Interface Click-to-Crop**: For already uploaded photos, you can directly click the thumbnail to bring up the cropping screen and re-crop at any time!

## 2026-08-20 (v1.2.4.0 - Private Cloud Backup Upgrade & Interface Optimization)
### Added
- **Custom Important Festival Reminders**: You can add exclusive "Important Festivals" (e.g., Wedding Anniversary, Partner's Birthday) in the settings. A few days before the festival approaches, as long as you add or edit a bookkeeping record, the system will thoughtfully pop up a reminder to prevent you from forgetting to prepare a gift or a feast!
- **Important Calendar Exclusive Star Mark**: On the perpetual calendar, the day of your custom important festival will display a unique "Exclusive Star Symbol", making this special day stand out in the monthly calendar.
- **Private Cloud Backup Major Upgrade**: Significantly enhanced the underlying system of the exclusive private cloud backup. Now, you only need to deploy the Google Cloud Script once, and it can be shared by all projects supporting this feature. The system will automatically create exclusive folders in your Google Drive and store them by category, eliminating the need for repeated setup for each project!

### Improvements
- **Backup Interface Visual Unification**: Redesigned the local backup (download file to phone/computer) section into exquisite rounded cards, and supported dark mode, making the overall visual of the settings page more balanced and beautiful.
- **Backup File Parsing Preview Optimization**: During cloud restore and local import, the preview window will now directly display the "True Total Number of Records in the Backup File", letting you clearly know the data volume in the backup file, and listing the number of duplicate records automatically filtered by the system below, avoiding the illusion that "the backup file is empty".
- **Layout Detail Fixes**: Fixed the issue where the backup-in-progress prompt text would occasionally wrap unnaturally due to file size information.

## 2026-08-20 (v1.2.3.0 - UI Page Transposition & Chart Adaptive Upgrade)
### Added
- **Perpetual Calendar Custom Display Switch**: Added multiple calendar display settings, allowing you to freely decide whether to display traditional festivals, 24 solar terms, and the exclusive "Fun Valentine's Day" on the 14th of every month.
- **Settings & Perpetual Calendar Page Upgrade**: Completely refactored the "Perpetual Calendar" and "System Settings" pages originally presented through small windows (Modal) into "Full-Screen Tabs" mode, providing a wider and more comfortable operating experience.

### Fixes
- **National Holiday Marking Fix**: Fixed the issue of over-displaying national holidays. Normal weekends are now marked with red date numbers, and meaningless "National Holiday" text is no longer displayed.
- **Layout Width Fix**: Fixed the issue where the "Perpetual Calendar" and "System Settings" over-extended and lost proportion on large computer screens due to a lack of maximum width restrictions. Unified the maximum width limit to 800px center-aligned.

### Improvements
- **Pie Chart Perfect Adaptation**: Upgraded the underlying pie chart drawing engine. Whether on a narrow mobile screen or a large computer screen, the pie chart will automatically detect available space and maximize filling, no longer experiencing issues of being squeezed smaller or legend text overlapping.
- **Bar Chart Underlying Optimization**: Refactored the chart drawing engine, removed redundant duplicate code, and improved the stability and performance of overall chart rendering.

## 2026-08-19 (v1.2.2.0 - Local & Cloud Restore Protection Upgrade)
### Improvements
- **Cloud Restore Overwrite Protection**: During cloud restore, if it finds that the proxy URL in the backup file is different from the local one, a dialog box will pop up asking whether to overwrite, preventing the original connection settings from being overwritten.
- **Local JSON Restore Upgrade**: Local JSON import now also synchronously supports the URL difference protection mechanism, and restored the automatic restoration capability of GAS connection settings, making device transfer smoother.

## 2026-08-19 (v1.2.1.0 - Mobile Compact UI Optimization)
### Improvements
- **Mobile Interface Optimization**: Significantly reduced the font size and card margins of the top fixed section, and changed the filter to a single-line horizontal scroll, returning screen space to the record list.

## 2026-08-18 (v1.2.0.0 - Cloud Restore & Major/Minor Category Optimization)
### Added
- **Cloud Restore Version Selection**: When downloading backups from the cloud drive, the historical backup versions on the cloud will be displayed, allowing users to freely choose which file to restore.

### Improvements
- **Default Category & Target Optimization**: Adjusted and streamlined the default major and minor income/expense categories (added "Shopping Mall" and "Mortgage") to enhance the intuitiveness of future bookkeeping.
- **Anti-Duplicate Import Mechanism**: Optimized the Fingerprint validation fool-proof mechanism. If physically duplicated records exist in the backup file, they will be automatically skipped during import to avoid database pollution.

## 2026-08-17 (v1.1.0.0 - Private Cloud Backup & Shared Footer)
### Added
- **GAS Private Cloud Backup Module**: Officially introduced an exclusive private cloud backup mechanism, allowing data to be backed up to your Google Drive with one click.
- **Shared Google Maps API Module**: Supported tutorial pop-ups and simplified the API Key binding process.
- **Global Shared Footer**: Unified display of copyright declaration and current version number.

### Improvements
- **Backup Button Interface Optimization**: Unified the visual proportions of the export/import backup buttons in the settings page.
- **Mobile Layout Fix**: Solved the boundary compression issue caused by dark mode switching and Tailwind CSS loading order.

## 2026-08-14 (v1.0.1.1 - Edit Record Fix)
### Fixes
- Fixed a severe error where editing and saving a single record and a fixed record would misjudge it as a "New Record".

## 2026-08-12 (v1.0.1.0 - Farmer's Almanac Module Fix)
### Fixes
- Fixed an issue where the Easter algorithm in the Farmer's Almanac module caused an infinite loop in the system.
- Fixed solar terms calculation logic, ensuring key solar terms like Qingming Festival can be accurately matched.

## 2026-08-11 (v1.0.0.0 - Perpetual Calendar & Core Refactoring)
### Added
- **Perpetual Calendar & Bazi Chart**: Officially online! Can be opened via the calendar button at the top, providing complete lunar date, stems-branches, and solar terms information.
- **National Holiday Sync Update**: Automatically syncs the latest holidays and market closing days from the Directorate-General of Personnel Administration.
- **Data Sorting & View Optimization**: The record list is now precisely sorted by date and creation time.

