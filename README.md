# TinyLedger

> 🇹🇼 若要查看繁體中文版，請參閱 [README.zh-TW.md](README.zh-TW.md)

This is a lightweight, privacy-focused, pure local-first bookkeeping tool (PWA) that I built for myself.
It not only combines the Farmer's Almanac with advanced financial analysis, but the best part is that it requires no backend server installation. Just open the browser and use it smoothly anytime, anywhere!

- **Current Version**: `v1.5.6.0` (2026-09-15)
- **Live Demo (GitHub Pages)**: [https://ssworld72.github.io/TinyLedger/](https://ssworld72.github.io/TinyLedger/)

---

## 💡 Design Philosophy

The birth of this small tool was entirely tailored based on my personal actual bookkeeping experience and daily usage preferences.
Rather than pursuing complicated and flashy features that may not necessarily be used, I prefer to return to the essence of life—I have transformed the pain points most frequently encountered in daily bookkeeping, as well as the tiny "it would be great if I could track expenses like this" needs in life, bit by bit into practical designs in the software. Therefore, from the smoothness of the interface and the convenience of offline operation to the integration of the Farmer's Almanac, every detail is full of practical considerations "to solve real-life scenarios." I hope this software, which stems from my personal experience, can also perfectly fit the daily needs of others and become a handy financial partner.

---

## 💬 Communication & Discussion

If you have any thoughts, suggestions, or encounter any problems during use, you are very welcome to communicate with me through the following ways:
- **[Issue Report (Issues)](https://github.com/SSWorld72/TinyLedger/issues)**: If you find a bug or want to request a new feature, you can raise it here.
- **[Exclusive Discussion Area (Discussions)](https://github.com/SSWorld72/TinyLedger/discussions)**: If you have any bookkeeping tips to share, or any casual chats and questions on any topic, feel free to drop by the discussion area!

---

## ☕ Support & Sponsorship

This is a completely **free, open-source, ad-free** personal small project.

From typing the first line of code, every feature, every bug fixed, and every late-night updated version has been driven by the passion to "make bookkeeping simple." There is no team and no sponsor, just me and a computer, silently polishing it into what it is today.

If this small tool happens to help you sort out the income and expenses in your life, or make bookkeeping a little bit easier, then it has already achieved its original wish.

If you are willing to go a step further and buy me a cup of coffee ☕ — that would definitely be the greatest motivation for me to continue maintaining it! Every sponsorship, no matter the size, is a super warm encouragement to me, meaning that people are really using it and finding it valuable.

**Thank you, truly.** 🙏

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A0R125NYMU)

---

## ✨ Main Features

This system covers various scenarios I would use in my daily life:

### 📝 Bookkeeping & Income/Expense Management
- **General Record List**: Supports daily bookkeeping of income and expenses. You can customize major and minor categories, and even mark who the money was spent on (e.g., yourself, family, specific projects). Supports instant viewing and deleting of single records.
  
  ![General Record List](pics/General_List.jpg)

- **Add & Edit Records**: An intuitive bookkeeping window that allows quick entry of amounts, category selection, transaction target setting, and provides memo notes with real-time calculation.
  
  ![Add & Edit Records](pics/Edit_Record.jpg)

- **Physical Receipt Photo Upload**: Sometimes when I get a physical invoice or receipt, I want to take a picture and save it. The system supports direct photo taking or photo uploading, with built-in cropping and compression tools, so you don't have to worry about photos taking up space, and you can re-crop them anytime.
  
  ![Physical Receipt Photo Upload](pics/Photo_Upload.jpg)

- **Fixed Record List**: For monthly rent, weekly fixed expenses, or annual subscription fees, it automatically aggregates all fixed income and expense rules, clearly listing the next execution time and cycle frequency.
  
  ![Fixed Record List](pics/Fixed_list.jpg)

- **Fixed Rule Setting & Editing**: Just set the cycle (daily, weekly, monthly, annually, etc.), and the system will automatically generate future expected records for you, saving the trouble of repetitive bookkeeping.
  
  ![Fixed Rule Setting & Editing](pics/Edit_Fixed_Rule.jpg)

- **Transaction Info & Target Management**: You can manage custom income/expense targets (e.g., family, specific friends, projects, etc.) and custom major/minor categories at any time, making the attribution of every income and expense more precise and clear.
  
  ![Transaction Info & Target Management](pics/Transaction_Info%20Management.jpg)

- **Multi-Account Management & Independent Budgets**: Supports customizing multiple asset accounts (like cash, bank accounts, credit cards, etc.), and allows assigning independent budgets and default usage accounts for each account, making account diversion clearer.
  
  ![Multi-Account Management & Independent Budgets](pics/Account_Settings.jpg)

- **Budget Control**: I can set a "Total Monthly Budget" and "Individual Account Budgets." The system will dynamically display a progress bar based on accumulated expenses, reminding myself not to overspend at any time.

  ![Budget Control](pics/Monthly_Budget.jpg)

- **List Pagination & Display Count**: You can set "N records per page" (10 / 20 / 30 / 40 / 50 / 100 / All). It will automatically return to the first page when switching months or filter conditions. Settings will be persistently stored and retained after backup/restore.

### 📅 Perpetual Calendar & Farmer's Almanac Integration
- **Calendar View & Display Settings**: Built-in beautiful monthly calendar mode where daily income and expense totals are clear at a glance; you can customize the start day of the week (Sunday or Monday), display of lunar solar terms, and marking of national holidays according to personal preference.
  
  ![Calendar View & Display Settings](pics/Calendar_&_Display_Settings.jpg)

- **Daily Transaction Records & Important Festival Reminders**: Clicking on any day on the calendar will instantly expand the income and expense list details for that day, while simultaneously displaying traditional folk festival reminders for the day.
  
  ![Daily Transaction Records & Important Festival Reminders](pics/Calendar_Daily_Transaction_Records_and_Important_Festival_Reminders.jpg)

- **Important Festival Reminders**: Integrates Taiwan's 24 solar terms and major traditional festivals (such as Lunar New Year, Dragon Boat Festival, Mid-Autumn Festival, etc.), marked instantly on the calendar to thoughtfully remind you of important moments in life.
  
  ![Important Festival Reminders](pics/Important_Festival_Reminders.jpg)

- **Traditional Farmer's Almanac**: Being in Taiwan, checking the date's auspiciousness is still very important! I have integrated lunar dates, heavenly stems and earthly branches (Bazi chart), 24 solar terms, and traditional festivals.

  ![Traditional Farmer's Almanac](pics/Lunar_Date.jpg)

- **National Holidays**: The system automatically connects with data from Taiwan's Directorate-General of Personnel Administration to display Taiwan's exclusive national holidays and market closing days, which can be updated with a single click. (Note: If other countries provide accessible public APIs in the future, integration and support can also be evaluated!)
  > 📌 **Data Source Acknowledgement**: Thanks to the open-source project [ruyut/TaiwanCalendar](https://github.com/ruyut/TaiwanCalendar) for organizing the Taiwan government calendar data into an easy-to-use JSON format for integration.
  
  ![National Holidays](pics/National_Holidays(Taiwan).jpg)

- **Location Positioning & Google Maps**: Integrated with Google Maps. When tracking expenses outdoors, you can pinpoint and record the consumption location with one click, and even click the link to open map navigation directly. Recalling it brings more feeling.
  
  ![Location Positioning & Google Maps](pics/Google_Map_Links.jpg)

### 📊 Statistics & Chart Analysis
- **Pie Chart (Category Proportion Analysis)**: Uses a pure native SVG donut chart to present the proportion of various categories of expenses or income. Supports interactive click drill-down to view subcategories, quickly grasping the flow of funds.
  
  ![Pie Chart](pics/Pie_Chart.jpg)

- **Bar Chart (Income/Expense Trend Comparison)**: An intuitive columnar trend chart clearly compares the changes in expenses and income by month or by day, showing spending peaks at a glance.
  
  ![Bar Chart](pics/Bar_Chart.jpg)

- **Line Chart (Income/Expense Trend Analysis)**: Continuous smooth line trends help observe the fluctuations of funds over time, assisting in formulating long-term savings plans.
  
  ![Line Chart](pics/Line_Chart.jpg)

- **Annual Income & Expense Statistical Analysis**: Comprehensive income and expense reports across months and the entire year, aggregating various indicator summaries, saving time and effort on annual settlements.
  
  ![Annual Income & Expense Statistical Analysis](pics/Annual_Chart.jpg)

- **Multi-Dimensional Filtering**: You can do deep filtering by time, income/expense type, category, or specific target, which is particularly useful when doing accounting.

  ![Multi-Dimensional Filtering](pics/Select_Chart.jpg)

### ☁️ Backup & Restore
- **Manual & Scheduled Auto Backup**: Supports immediate manual backup and periodic background auto-backup mechanisms by the browser, adding an extra layer of protection to data security.

- **GAS Private Cloud Backup**: I really don't want to put my personal financial privacy on someone else's server, so I wrote a Google Apps Script (GAS) to allow data to be encrypted and backed up to my exclusive Google Drive.

- **ZIP Text-Image Separation Technology**: Whether it's cloud synchronization or local download, the system uses ZIP text-image separation compression to pack text and photos separately, ensuring the minimum volume of the backup file and making cross-device transfer convenient.

  ![Manual & Scheduled Auto Backup](pics/Manual_&_Auto_Backup.jpg)

- **Precise Sync Status & Progress**: Supports a four-line parallel data writing progress bar accurate to single digits. It no longer lags when restoring massive data, and can smoothly and truly reflect the restoration status of every single record.

- **Database Security & Danger Zone**: Provides strict fool-proof designs for the danger zone, including one-click clearing of old cache, resetting specific databases, or full system wipe recovery, ensuring operations are safe and transparent.
  
  ![Database Security & Danger Zone](pics/Danger_Zone.jpg)

- **Pure Offline Architecture**: All data is stored in the browser's IndexedDB, so you can track expenses normally even in a basement without internet.

### 🎨 Interface & Experience
- **Appearance Theme & Color Customization**: Provides multiple theme color schemes such as elegant dark and modern light, and further supports custom color fine-tuning to create a unique and exclusive visual experience.
  
  ![Appearance Theme & Color Customization](pics/Appearance_Theme.jpg)

- **Multi-Language Switching (i18n)**: Built with perfect 9 language switching including Traditional Chinese, Simplified Chinese, English, Japanese, Korean, Thai, Hindi, French, and German. All functions, fields, and prompt messages can be seamlessly switched instantly in both directions.
  
  ![Multi-Language Switching](pics/Language.jpg)

- **PWA Support**: You can directly add the website to your phone's home screen, and it runs as smoothly as a native App.

- **Touch & Gesture Optimization**: I've made many adjustments for the operating experience on mobile phones and tablets, making scrolling and clicking very intuitive.

- **Personalized Display Settings**: Personal preference settings like the number of records per page are persistently stored locally on the device and retained during backup/restore.

### ⚙️ System Settings & Info
- **System Logs**: Records detailed operational histories of backups, restores, database upgrades, and key actions. You can access them at any time to troubleshoot anomalies, ensuring transparency and reliability.
  
  ![System Logs](pics/System_Logs.jpg)

- **About System & Version Info**: Clearly displays the project version number, acknowledgment list, open-source library licenses, and author information, continuously iterating and updating to maintain the best quality.
  
  ![About System & Version Info](pics/About.jpg)

---

## 🏗️ Technical Architecture

| Item | Description |
|---|---|
| Frontend Framework | Vanilla JavaScript (ES Module) + Tailwind CSS |
| Local Storage | IndexedDB + LocalStorage |
| Chart Engine | Pure native SVG engine (In-house `charts.js`) |
| Calendar Algorithm | Traditional Farmer's Almanac & Stems-Branches algorithm |
| Cross-Domain & Positioning | Google Apps Script (GAS) / Google Maps Places API |
| Deployment Method | GitHub Pages (Static Webpage) or Open directly in local browser |

---

## 🚀 Quick Start

No need to install any software, just click the link and use it!
👉 [https://ssworld72.github.io/TinyLedger/](https://ssworld72.github.io/TinyLedger/)

### 🎲 Generate Sample Data
If you want to quickly experience the system features, you can use the built-in sample data generator. It will automatically fill in random income/expenses and chart data from the past few months for you to preview:
👉 [https://github.com/SSWorld72/TinyLedger/generate_sample.html](https://github.com/SSWorld72/TinyLedger/generate_sample.html)

> **⚠️ Important Usage Advice**
> 
> Since this is a pure frontend tool, all data is stored inside the browser. **If you manually clear the browser's "Site Data and Cache," the bookkeeping records will disappear!**
> 
> 👉 It is strongly recommended to complete the binding of **"Private Cloud Backup (GAS Backend)"** in the "System Settings" before using. After binding, you can backup data to your exclusive Google Drive with just a tap, and never fear data loss again!

---

## ☁️ Setup Private Cloud Backup (GAS Backend)

This is a solution I designed to solve privacy issues, supporting encrypted backup of bookkeeping data to a private Google Drive, achieving 100% privacy and cross-device synchronization.

### Deployment Tutorial (Only needs to be set up once)

#### Phase 1: Paste Code
1. Go to [Google Apps Script](https://script.google.com/) and click "＋ New Project" in the top left corner.
2. Click on the default "Untitled project" in the top left and rename it to an easily recognizable name, e.g., `General_PrivateCloudBackup`.
3. Paste all the `gas_private_backup.js` code provided under the `utils/gas/` directory of this system and save it.

#### Phase 2: Deploy & Set Permissions
1. Click the blue "Deploy" button in the top right corner and select "New deployment".
2. In the pop-up window, click the gear icon in the top left corner and check "Web app".
3. **【Most Important】**: For "Execute as", please ensure you select "**Me**", and for "Who has access", please select "**Anyone**".
4. After setting it up, click "Deploy" in the bottom right corner.

#### Phase 3: Authorize & Get URL
1. (First Deployment) The system will pop up an authorization window. Click "Authorize access" and choose your Google account.
2. (First Deployment) If a warning screen appears, please click "Advanced" -> "Go to ... (unsafe)" in the bottom left corner, and then click "Allow".
3. After authorization is complete, copy the "**Web app URL**" under the Web app section.
4. Go back to the "System Settings" page of the ledger, paste the URL into the GAS Cloud Backup box, and the binding is complete!

> 💡 **Pro Tip**: If you have previously deployed the general version of the GAS backup script for other projects, you can directly paste the same URL! The system will automatically categorize and store it in Google Drive based on the project name, without overwriting each other at all.

---

## 📦 Third-Party Libraries

To ensure the project's "purity" and 100% offline operation capability (PWA), I have uniformly placed all external packages in the `libs/` directory, without mixing them with the project's own code. This part maintains strict management standards:

- **Cropper.js** (`libs/cropper/`): Used to provide advanced photo cropping and gesture zooming functions.
  > For information on package updates and reference methods, please refer to the detailed description in [libs/cropper/README.md](libs/cropper/README.md).
- **JSZip** (`libs/jszip/`): Provides browser-side ZIP packaging and extraction functions, used for local text-image separation backups.
  > For version information and sources, please refer to the detailed description in [libs/jszip/README.md](libs/jszip/README.md).
- **Tailwind CSS** (`libs/tailwind/`): Used to provide utility CSS classes to assist with layout.
  > For the reasons for offline introduction and usage methods, please refer to the detailed description in [libs/tailwind/README.md](libs/tailwind/README.md).
- **Google Fonts - Inter** (`libs/fonts/`): A sans-serif font used for overall interface text typography to enhance the reading experience.
  > To ensure stability under extreme offline conditions, the font files (`.woff2`) have been packaged and downloaded locally, no longer relying on external CDNs. Licensed under SIL OFL 1.1.
- **Material Icons** (`libs/icons/`): Provides various practical icons used in the interface (such as settings, edit, delete, etc.).
  > To ensure icons do not break when disconnected from the internet, the core font files (`.woff2`) have been fully localized. Licensed under Apache License 2.0.

---

## 🗺️ Setup Google Maps API (Optional)

If you, like me, prefer to record consumption locations conveniently while bookkeeping, you can also consider integrating the Google Maps Places API.

### Application & Binding Tutorial (Only needs to be set up once)

#### Phase 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and log in with your Google account.
2. Click the "**Select a project**" dropdown menu in the top navigation bar, and then click "**New Project**" in the top right corner.
3. Enter an easily recognizable project name (e.g., `TinyLedger Map`), and then click "Create".
4. After creation is complete, confirm that the project is currently selected (the newly created project name should be displayed at the top).

#### Phase 2: Enable API & Create Key
1. In the left menu, click "**APIs & Services**" > "**Library**".
2. Search for and enable the following two APIs in the search box:
   - **Places API (New)**
   - **Maps JavaScript API**
3. Go back to the left menu, click "**APIs & Services**" > "**Credentials**".
4. Click "**+ Create Credentials**" > "**API key**" at the top, and the system will automatically generate a key.
5. In the pop-up window, first **copy** this key (you'll need to paste it back into the APP later).

#### Phase 3: (Recommended) Restrict Key + Paste Back to Settings
1. In the pop-up window from just now, click "**Edit API key**" (or click the pencil icon of that key in the credentials list).
2. In the "**Application restrictions**" section, select "**Websites**", and click "**+ Add**" to add `https://ssworld72.github.io/*` to allow access for the official online version. *(Note: If you have local development needs, you can additionally add `http://127.0.0.1/*` and `http://localhost/*`)*
3. Scroll down to the "**API restrictions**" section, select "**Restrict key**", then check the two APIs enabled above from the dropdown to bind them.
4. Click "**Save**".
5. Finally, paste the copied key back into the "**Google Maps API Key**" input box on the settings page, and you're done!

> 💡 **Fee Explanation**: Google provides $200 of free map credits per month, which you don't need to worry about for general personal bookkeeping purposes. Filling in billing information is only a step for Google's anti-abuse verification.

---

## 🌐 Multi-Language (i18n) Expansion Guide

This project supports internationalized multi-languages. If you want to add a new language set (e.g., Japanese `ja-JP`), it only takes three steps:

1. **Create Project-Specific Dictionary File**:
   - Copy `i18n/zh-TW.js` and save it as `i18n/ja-JP.js`.
   - Replace the Chinese translations inside with the corresponding Japanese.
2. **Create Shared Module Dictionary File**:
   - Copy `utils/i18n/zh-TW.js` and save it as `utils/i18n/ja-JP.js`.
   - Translate the text for shared components (like chart formats, backup prompts, etc.).
3. **Register New Language (Main Project Level)**:
   - Open `i18n/manifest.js`.
   - Add a record in the `supportedLanguages` array, for example: `{ code: 'ja-JP', nativeName: '日本語' }`.
4. **Register New Language (Shared Layer Fallback)**:
   - Open `utils/js/i18nEngine.js`.
   - Find the code `const supportedLanguages = manifestMod.supportedLanguages || [`, and synchronously add the new language to the fallback array. This ensures that when the main project's language list fails to load due to caching or network issues, the system can still safely degrade and correctly display the new language.

After completing the above steps, refresh the webpage, and you will be able to see the new language in the language menu under system "Settings." After switching, the system will automatically apply that dictionary file.

---

## 📁 File List & Usage Description

Below is the technical file architecture and modularization description of the project. This project adopts a pure frontend architecture (HTML/CSS/JS), and all file designs follow the principles of high cohesion and low coupling:

```text
📦 TinyLedger
 ├── 🧩 components/ .............................. UI view fragments, loaded dynamically via htmlLoader
 │    ├── 🗂️ modals/ ........................... Dialog boxes
 │    │    ├── 📄 modal-account-filter.html ...... Dropdown dialog for account filters
 │    │    ├── 📄 modal-add-record.html .......... Form window for adding or editing a single record
 │    │    ├── 📄 modal-crop.html ................ Image cropping and zooming window when uploading receipt photos
 │    │    ├── 📄 modal-photo-settings-help.html . Explanation and tutorial window for photo backup mechanism in settings page
 │    │    ├── 📄 modal-settings-manage-cat.html . Edit window for adding, deleting, and reordering specific income/expense categories
 │    │    └── 📄 modal-settings-manage-target.html . Window for adding and editing specific targets
 │    └── 🗂️ tabs/ ............................. Main page tabs
 │         ├── 📄 tab-calendar.html .............. Monthly calendar view and daily income/expense list tab
 │         ├── 📄 tab-settings.html .............. System settings, data backup, and account management tab
 │         └── 📄 tab-stats.html ................. Statistics reports and charts tab
 │
 ├── 🎨 css/ ..................................... Exclusive styles
 │    ├── 📄 calendar.css ........................ Layout exclusively for calendar view, including lunar dates, festivals, and record dot markers
 │    ├── 📄 modal.css ........................... Uniformly defines pop-up and close animation styles for all dialog windows (Modals) and global overlay layers
 │    └── 📄 style.css ........................... Main stylesheet of the project, defining exclusive layouts, dynamic effects, and theme variables
 │
 ├── 🌐 i18n/ .................................... Project multi-language dictionary (Application layer in the dual-layer architecture)
 │    ├── 📄 manifest.js ......................... Language declaration list, defining language codes and names supported by the system
 │    ├── 📄 zh-TW.js ............................ Project-specific Traditional Chinese base dictionary
 │    ├── 📄 zh-CN.js ............................ Project-specific Simplified Chinese dictionary
 │    ├── 📄 en-US.js ............................ Project-specific English dictionary
 │    ├── 📄 ja-JP.js ............................ Project-specific Japanese dictionary
 │    ├── 📄 ko-KR.js ............................ Project-specific Korean dictionary
 │    ├── 📄 th-TH.js ............................ Project-specific Thai dictionary
 │    ├── 📄 hi-IN.js ............................ Project-specific Hindi dictionary
 │    ├── 📄 fr-FR.js ............................ Project-specific French dictionary
 │    └── 📄 de-DE.js ............................ Project-specific German dictionary
 │
 ├── ⚙️ js/ ...................................... Project core logic
 │    ├── 🗂️ components/ ......................... View controllers
 │    │    ├── 📄 calendarView.js ................ Calendar view logic, handling calendar rendering, daily detail expansion, and monthly income/expense statistics
 │    │    ├── 📄 locationSearch.js .............. Location search logic, handling location searching in forms, autocomplete, and recent location selection
 │    │    ├── 📄 recordModal.js ................. Add/edit record dialog window logic, including camera capture, Cropper cropping, and photo compression processing
 │    │    ├── 📄 settingsView.js ................ System settings page logic, including global option saving and loading, and local backup/restore logic
 │    │    └── 📄 statsView.js ................... Statistics page logic, handling filtering, calculating category totals, and drawing charts
 │    ├── 🗂️ utils/
 │    │    └── 📄 htmlLoader.js .................. HTML dynamic loader, loading modular views and dialog boxes under components/ at runtime
 │    ├── 📄 app.js .............................. Application main logic, handling initialization, event binding, list rendering, and coordinating various components
 │    ├── 📄 db.js ............................... Database layer, encapsulating all native operations (CRUD) for browser IndexedDB
 │    ├── 📄 i18nMigration.js .................... Handles database migration and old data compatibility after the introduction of the multi-language system (translation of old hardcoded Chinese categories)
 │    ├── 📄 state.js ............................ State management hub, centrally managing global state variables and handling filters and statistical calculations
 │    └── 📄 utils.js ............................ Project-specific fundamental utility functions (handling fixed income/expense expansion calculation, transaction fingerprint generation, etc.)
 │
 ├── 📦 libs/ .................................... Third-party libraries
 │    ├── 🗂️ cropper/ .......................... Provides photo dragging, zooming, and cropping features
 │    ├── 🗂️ fonts/ ............................ Localized font files for Google Fonts (Inter)
 │    ├── 🗂️ icons/ ............................ Localized font files for Material Icons
 │    ├── 🗂️ jszip/ ............................ Provides browser-side ZIP packaging and extraction functions
 │    └── 🗂️ tailwind/ ......................... Provides utility CSS classes to assist with layout
 │
 ├── 🖼️ pics/ .................................... System operation screenshots used in README documentation
 │
 ├── 🛠️ utils/ ................................... Cross-project shared bottom-layer modules
 │    ├── 🎨 css/
 │    │    └── 📄 modern-ui.css .................. Modernized UI styling system and base color variables shared across all projects
 │    ├── ☁️ gas/ ................................ Google Apps Script backend deployment
 │    │    ├── 📄 gas_private_backup.js .......... Private cloud backup backend script deployed on the Google Apps Script side (General version)
 │    │    └── 📄 gas_proxy_with_logging.js ...... Cloud backup backend script with extended logging mechanism
 │    ├── 🌐 i18n/ ............................... Shared module multi-language dictionary (Shared layer in the dual-layer architecture)
 │    │    ├── 📄 zh-TW.js ....................... Bottom-layer shared module Traditional Chinese base dictionary
 │    │    ├── 📄 zh-CN.js ....................... Bottom-layer shared module Simplified Chinese dictionary
 │    │    ├── 📄 en-US.js ....................... Bottom-layer shared module English dictionary
 │    │    ├── 📄 ja-JP.js ....................... Bottom-layer shared module Japanese dictionary
 │    │    ├── 📄 ko-KR.js ....................... Bottom-layer shared module Korean dictionary
 │    │    ├── 📄 th-TH.js ....................... Bottom-layer shared module Thai dictionary
 │    │    ├── 📄 hi-IN.js ....................... Bottom-layer shared module Hindi dictionary
 │    │    ├── 📄 fr-FR.js ....................... Bottom-layer shared module French dictionary
 │    │    └── 📄 de-DE.js ....................... Bottom-layer shared module German dictionary
 │    └── ⚙️ js/ ................................. Shared utilities library
 │         ├── 📄 backupManager.js ............... Universal backup management center, organizing and coordinating UI flows and progress displays for exports and imports
 │         ├── 📄 charts.js ...................... Pure native SVG chart drawing engine, handling rendering and interaction logic for pie and bar charts
 │         ├── 📄 dangerZone.js .................. "Danger Operations Zone" in the settings page (high-risk functions like clearing the database)
 │         ├── 📄 dataMerger.js .................. Smart merge logic during data imports (add/update/conflict handling)
 │         ├── 📄 deviceDetection.js ............. Device environment detection module, providing utility functions to determine mobile or desktop views
 │         ├── 📄 errorHandler.js ................ Centralized error catching and exception handling mechanism
 │         ├── 📄 gasBackupModule.js ............. Handles private cloud backup/restore logic for communicating with Google Apps Script (GAS)
 │         ├── 📄 gasProxy.js .................... Cloud connection proxy and relay module
 │         ├── 📄 globalFestivals.js ............. Global common festivals and fun festivals (e.g., Valentine's Day) determination module
 │         ├── 📄 globalFooter.js ................ Global footer copyright information component
 │         ├── 📄 googleApiModule.js ............. Google Maps Places API connection module, handling location searches and positioning
 │         ├── 📄 i18nEngine.js .................. Core multi-language engine, dynamically loading dictionary files, binding DOM attributes (data-i18n), and global text replacements
 │         ├── 📄 logger.js ...................... Standardized log output utility
 │         ├── 📄 lunarCalendar.js ............... Farmer's Almanac, perpetual calendar core calculation engine, and national holiday management
 │         ├── 📄 shared-i18n.js ................. Multi-language core shared functions, providing common time, number, and currency format conversions
 │         ├── 📄 stickyListHeader.js ............ Controls sticky header effects when scrolling lists
 │         ├── 📄 taiwanHolidays.js .............. Reference data file for Taiwan's Directorate-General of Personnel Administration national holidays and make-up workdays
 │         ├── 📄 themeSwitcher.js ............... Handles switching between dark and light theme modes
 │         ├── 📄 tipBox.js ...................... Provides global tooltip messages and notification dialog (Toast/Snackbar) features
 │         ├── 📄 uiBlocker.js ................... Global UI overlay and busy state management (preventing operation conflicts)
 │         ├── 📄 uiDialogs.js ................... Shared confirm/warning dialog components
 │         └── 📄 zipBackupHelper.js ............. Handles local backups (packaging and parsing ZIP files containing text-image separated data)
 │
 ├── 📄 CHANGELOG.md ............................. Records detailed update history for each version
 ├── 📄 generate_sample.html ..................... Development helper tool, used to automatically generate massive random test data (Sample Data)
 ├── 📄 TinyLedger_SampleData.zip ............... Fake data backup file exported by the test generator
 ├── 📄 index.html ............................... Application entry point, containing all UI skeletons and window (Modal) definitions
 └── 📄 README.md ................................ Project introduction and user manual (i.e., this document)
```

---

## 💡 Frequently Asked Questions (FAQ)

If you encounter issues, here are some answers to problems I've faced or frequently compiled before:

### Q: Where is the bookkeeping data stored? Will it be leaked?
**As long as your device is safe, your data will not be leaked.**
Because this is a "pure frontend" architecture, all bookkeeping records and settings will be stored in your browser's local database (IndexedDB). I haven't set up any centralized servers to collect data, so as long as the device itself hasn't been hacked or stolen by malicious software, the financial privacy is only visible to the device owner.

### Q: If I change phones or computers, how do I transfer data?
There are two ways for a painless transfer:
1. **Manual Export/Import**: Click "Export Backup" on the old device's settings page, and it will download a lightweight `.zip` file. Transfer this file to the new device and "Import" it, and you're done.
2. **Private Cloud Backup (Recommended)**: Follow the tutorial above to bind the ledger to a private Google Drive. Click "Backup to Private Cloud" on the old device, then paste the same URL on the new device and click "Restore from Cloud" to retrieve all data in a second!

### Q: Can cloud and local backup data communicate with each other?
**100% interoperable and seamless!** 
Now, whether it is cloud or local, the system uniformly adopts the "ZIP Text-Image Separation Technology" for backups. Whether you export a ZIP locally or upload directly to a private cloud, the formats are completely compatible. Even if you previously saved the old plain text JSON, the system's restore mechanism can automatically identify and flawlessly import it.

### Q: Will the backup file get too big and slow down the speed as more photos are saved?
**No problem in the short term, but watch out for space if using cloud backups.**
I will automatically crop and compress photos before uploading. One photo is only about 50KB~100KB. Even accumulating thousands of photos, the JSON backup file is only about 100MB, which modern mobile phones can handle with ease.

**💡 Efficient ZIP Text-Image Separation Technology**
To avoid backup files getting too large and causing load lag as more photos are saved, the system has comprehensively introduced "ZIP Text-Image Separation Technology".
Whether it's stored in your Google Drive or downloaded locally, the system will automatically separate plain text data from physical photos and pack them into a lightweight `.zip` file. This method not only solves the volume inflation caused by Base64 conversion but also significantly reduces the memory burden when parsing on mobile web browsers!

---

## 📝 Update Logs

Want to know what new features were secretly added recently? Please refer to the complete [CHANGELOG.md](CHANGELOG.md).

---

## 🙏 Acknowledgements & Open Source Data Sources

The birth of this project, in addition to personal development enthusiasm, has also benefited from the selfless dedication of the open-source community. Special thanks to the authors of the following data sources and open-source packages:

### 📅 Data Sources
- **[ruyut/TaiwanCalendar](https://github.com/ruyut/TaiwanCalendar)**: The "Taiwan National Holidays" feature of this system is fundamentally connected to the JSON file organized and published on CDN by this project. Thanks to the developers for converting the raw data from Taiwan's Directorate-General of Personnel Administration into a frontend developer-friendly open-source format.

### 🛠️ Open Source Libraries & Resources
- **[Cropper.js](https://fengyuanchen.github.io/cropperjs/)**: Provides a smooth photo cropping and gesture zooming experience.
- **[JSZip](https://stuk.github.io/jszip/)**: Implemented pure frontend data packaging and extraction functions, making it a great contributor to the "local text-image separation backup" feature.
- **[Tailwind CSS](https://tailwindcss.com/)**: An elegant Utility-First CSS framework that makes the interface's RWD responsive design fast and beautiful.
- **[Google Fonts (Inter)](https://fonts.google.com/specimen/Inter)**: Creates a modern sans-serif font for an excellent reading experience.
- **[Material Icons](https://fonts.google.com/icons)**: Provides rich and intuitive operational icons in the system.

---

## 📄 License

This project is for personal learning and research use only, **commercial use is strictly prohibited**.

---

## ☕ Support & Sponsorship

This is a completely **free, open-source, ad-free** personal small project.

From typing the first line of code, every feature, every bug fixed, and every late-night updated version has been driven by the passion to "make bookkeeping simple." There is no team and no sponsor, just me and a computer, silently polishing it into what it is today.

If this small tool happens to help you sort out the income and expenses in your life, or make bookkeeping a little bit easier, then it has already achieved its original wish.

If you are willing to go a step further and buy me a cup of coffee ☕ — that would definitely be the greatest motivation for me to continue maintaining it! Every sponsorship, no matter the size, is a super warm encouragement to me, meaning that people are really using it and finding it valuable.

**Thank you, truly.** 🙏

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A0R125NYMU)
