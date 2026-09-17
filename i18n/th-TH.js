export default {
    categories: {
        expense: {
            food: 'อาหารและเครื่องดื่ม',
            family: 'ค่าใช้จ่ายในครอบครัว',
            medical: 'การรักษาพยาบาล',
            clothing: 'เสื้อผ้า',
            device: 'อุปกรณ์ 3C',
            transport: 'ค่าเดินทาง',
            entertainment: 'ความบันเทิง',
            education: 'การศึกษา',
            tax: 'ภาษี',
            other: 'อื่นๆ'
        },
        income: {
            salary: 'เงินเดือน',
            investment: 'การลงทุน',
            other: 'อื่นๆ'
        }
    },
    targets: {
        self: 'ตัวเอง',
        husband: 'สามี',
        wife: 'ภรรยา',
        child: 'ลูก',
        grandpa: 'ปู่/ตา',
        grandma: 'ย่า/ยาย',
        family: 'ครอบครัว',
        other: 'อื่นๆ'
    },
    subcategories: {
        expense: {
            food: { breakfast: 'อาหารเช้า', lunch: 'อาหารกลางวัน', dinner: 'อาหารเย็น', midnight: 'อาหารมื้อดึก', drink: 'เครื่องดื่ม', noodle: 'บะหมี่กึ่งสำเร็จรูป', snack: 'ขนมขบเคี้ยว', bread: 'ขนมปัง' },
            family: { allowance: 'เงินทอน', water: 'ค่าน้ำ', electricity: 'ค่าไฟ', phone: 'ค่าโทรศัพท์', internet: 'ค่าอินเทอร์เน็ต', furniture: 'เฟอร์นิเจอร์', appliance: 'เครื่องใช้ไฟฟ้า', cleaning: 'ผลิตภัณฑ์ทำความสะอาด', mortgage: 'สินเชื่อบ้าน', mall: 'ห้างสรรพสินค้า' },
            medical: { insurance: 'ค่าประกัน', medical: 'ค่ารักษาพยาบาล', supplement: 'อาหารเสริม' },
            clothing: { coat: 'เสื้อโค้ท', clothes: 'เสื้อผ้า', pants: 'กางเกง', skirt: 'กระโปรง', shoes: 'รองเท้า', hat: 'หมวก', scarf: 'ผ้าพันคอ', gloves: 'ถุงมือ', underwear: 'ชุดชั้นใน', underpants: 'กางเกงใน', socks: 'ถุงเท้า', contacts: 'คอนแทคเลนส์' },
            device: { computer: 'คอมพิวเตอร์', phone: 'โทรศัพท์มือถือ', tablet: 'แท็บเล็ต', console: 'เครื่องเล่นเกม', accessories: 'อุปกรณ์เสริมมือถือ' },
            transport: { train: 'ตั๋วรถไฟ', hsr: 'ตั๋วรถไฟความเร็วสูง', mrt: 'ตั๋วรถไฟใต้ดิน', taxi: 'แท็กซี่', accommodation: 'ค่าที่พัก', ticket: 'ตั๋วเข้าชม', parking: 'ค่าจอดรถ', gas: 'ค่าน้ำมัน', maintenance: 'การบำรุงรักษารถ' },
            entertainment: { movie: 'ดูหนัง', pinball: 'พินบอล', balloon: 'ลูกโป่ง', claw: 'ตู้คีบตุ๊กตา', karaoke: 'ร้องคาราโอเกะ', gacha: 'กาชา', game: 'เติมเกม' },
            education: { books: 'หนังสือ', course: 'คอร์สเรียน', exam: 'สอบ', dine: 'ทานอาหารร่วมกัน', gift: 'ของขวัญ', red_envelope: 'ซองแดง' },
            tax: { nhi: 'ประกันสุขภาพ', labor: 'ประกันสังคม', national: 'บำนาญแห่งชาติ', business: 'ภาษีธุรกิจ', license: 'ภาษีป้ายทะเบียน', income: 'ภาษีเงินได้', house: 'ภาษีโรงเรือน', fuel: 'ภาษีเชื้อเพลิง', land: 'ภาษีที่ดิน' },
            other: { misc: 'จิปาถะ', lost: 'สูญหาย', unclassified: 'ไม่ได้แยกประเภท' }
        },
        income: {
            salary: { base: 'เงินเดือนพื้นฐาน', bonus: 'โบนัส', festival: 'เทศกาล', overtime: 'ล่วงเวลา', parttime: 'งานพาร์ทไทม์' },
            investment: { stock: 'หุ้น', dividend: 'เงินปันผล', interest: 'ดอกเบี้ยเงินฝาก', fund: 'ผลตอบแทนกองทุน', crypto: 'แลกเปลี่ยน/คริปโต' },
            other: { gift: 'เงินของขวัญ', refund: 'เงินคืน', lottery: 'ถูกล็อตเตอรี่', subsidy: 'เงินอุดหนุน' }
        }
    },

    logs: {
        /* duplicate removed */
        db: {
            migrationStart: '[ฐานข้อมูล] เริ่มต้นการย้ายรหัสการจำแนกประเภท i18n...',
            migrationSuccess: '[ฐานข้อมูล] การย้ายรหัสการจำแนกประเภท i18n เสร็จสมบูรณ์！',
            migrationFail: '[ฐานข้อมูล] การย้ายรหัสการจำแนกประเภท i18n ล้มเหลว: {error}',
            error: '[ฐานข้อมูล] ข้อผิดพลาด:',
            saveCategorySuccess: '[ฐานข้อมูล] บันทึกการตั้งค่าหมวดหมู่ (saveCategory) สำเร็จ',
            deleteCategorySuccess: '[ฐานข้อมูล] ลบการตั้งค่าหมวดหมู่ (deleteCategory) สำเร็จ',
            saveTargetSuccess: '[ฐานข้อมูล] บันทึกการตั้งค่าเป้าหมาย (saveTarget) สำเร็จ',
            deleteTargetSuccess: '[ฐานข้อมูล] ลบการตั้งค่าเป้าหมาย (deleteTarget) สำเร็จ',
            saveTransactionSuccess: '[ฐานข้อมูล] บันทึกรายการ (saveTransaction) สำเร็จ',
            batchSaveTransactionsSuccess: '[ฐานข้อมูล] บันทึกรายการแบบกลุ่ม (batchSaveTransactions) สำเร็จ',
            batchSaveTransactionsFail: '[ฐานข้อมูล] การบันทึกรายการแบบกลุ่มล้มเหลว:',
            deleteTransactionSuccess: '[ฐานข้อมูล] ลบรายการ (deleteTransaction) สำเร็จ',
            deleteTransactionsByFixedIdSuccess: '[ฐานข้อมูล] ลบรายการที่เชื่อมโยงกับบันทึกคงที่แบบกลุ่ม (deleteTransactionsByFixedId) สำเร็จ',
            saveFixedRecordSuccess: '[ฐานข้อมูล] บันทึกรายการคงที่ (saveFixedRecord) สำเร็จ',
            batchSaveFixedRecordsSuccess: '[ฐานข้อมูล] บันทึกรายการคงที่แบบกลุ่ม (batchSaveFixedRecords) สำเร็จ',
            batchSaveFixedRecordsFail: '[ฐานข้อมูล] การบันทึกรายการคงที่แบบกลุ่มล้มเหลว:',
            deleteFixedRecordSuccess: '[ฐานข้อมูล] ลบรายการคงที่ (deleteFixedRecord) สำเร็จ'
        },
        calendar: {
            holidayLoadError: 'ไม่สามารถโหลดข้อมูลวันหยุดสำหรับปี {year}',
            loadHolidaysFail: '[ปฏิทิน] ไม่สามารถโหลดข้อมูลวันหยุดประจำปีสำหรับปีนี้...'
        },
        settings: {
            forceClearComplete: '[การตั้งค่า] บังคับล้างข้อมูลเสร็จสมบูรณ์ ล้าง IndexedDB และรายการ localStorage {removed} รายการ (เก็บการตั้งค่าระบบ {kept} รายการ)',
            accountUpdateSuccess: '[การตั้งค่า] อัปเดตการตั้งค่าบัญชี (saveAccounts) สำเร็จ',
            checkAccountDataError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลบัญชี:',
            backupUpdateSuccess: '[การตั้งค่า] บันทึกการตั้งค่าระบบคลาวด์ส่วนตัวและสถานะการซิงค์สำเร็จ',
            saveAccountsSuccess: '[การตั้งค่า] อัปเดตการตั้งค่าบัญชี (saveAccounts) สำเร็จ',
            cloudBackupSuccess: '[การตั้งค่า] บันทึกการตั้งค่าระบบคลาวด์ส่วนตัวและสถานะการซิงค์สำเร็จ',
            restoreError: 'เกิดข้อผิดพลาดระหว่างการกู้คืน:',
            exportJsonSuccess: '[สำรองข้อมูล] ส่งออกการสำรองข้อมูลในเครื่องสำเร็จ: ขนาด ZIP ',
            fileReadError: 'การอ่านไฟล์ล้มเหลว',
            importJsonSuccess: '[สำรองข้อมูล] นำเข้าจากการสำรองข้อมูลในเครื่องสำเร็จ: เพิ่ม/อัปเดต ',
            checkAccountError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลบัญชี:',
            checkCategoryError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลหมวดหมู่:',
            checkCategoryBatchError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลหมวดหมู่แบบกลุ่ม:',
            checkTargetError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลเป้าหมาย:',
            checkTargetBatchError: '[การตั้งค่า] ข้อผิดพลาดในการตรวจสอบข้อมูลเป้าหมายแบบกลุ่ม:',
            keptKeyGmaps: 'Google Maps API คีย์',
            keptKeyGas: 'การตั้งค่า GAS คลาวด์ส่วนตัว',
            keptKeyI18n: 'สถานะ i18n Migration',
            keptKeyLang: 'การตั้งค่าภาษา'
        },
        record: {
            festivalReminderError: '[เตือนความจำเทศกาลสำคัญ] ข้อผิดพลาด:',
            saveFail: '[บันทึกบัญชี] การบันทึกล้มเหลว:'
        },
        location: {
            fetchPlaceInfoFail: '[ค้นหาสถานที่] ไม่สามารถดึงข้อมูลสถานที่ทั้งหมด:',
            apiLoadFail: '[ค้นหาสถานที่] ไม่สามารถโหลด Google Maps API...'
        },
        app: {
            alreadyInitialized: '[แอปหลัก] app.js ถูกเปิดใช้งานแล้ว ข้ามการดำเนินการซ้ำ...'
        },
        htmlLoader: {
            loadFail: '[ตัวโหลด HTML] ไม่สามารถโหลดได้',
            fetchFail: '[ตัวโหลด HTML] ไม่สามารถดึงข้อมูลได้'
        }
    },
    ui: {
        common: {
            unnamed: '(ไม่มีชื่อ)'
        },
        footer: {
            unnamedProject: 'โครงการที่ไม่มีชื่อ',
            githubProject: 'GitHub',
            releaseDate: 'วันที่เผยแพร่: {date}'
        },
        app: {
            name: 'TinyLedger',
            fullName: 'สมุดบัญชีจิ๋ว'
        },
        accounts: {
            defaultName: 'บัญชีเริ่มต้น',
            colors: {
                blue: 'สีน้ำเงิน', green: 'สีเขียว', red: 'สีแดง', yellow: 'สีเหลือง', purple: 'สีม่วง', gray: 'สีเทา'
            },
            filterAll: 'ทั้งหมด',
            filterPartial: '({selected}/{total})',
            alertNoAccount: 'กรุณาเลือกอย่างน้อยหนึ่งบัญชี!'
        },
        tabs: {
            rules: 'หมวดหมู่ / กฎ',
            details: 'หมวดหมู่ / รายละเอียด'
        },
        nav: {
            addRecord: 'เพิ่มรายการใหม่',
            backToList: 'กลับไปที่รายการ',
            stats: 'แผนภูมิ',
            calendar: 'ปฏิทิน',
            settings: 'การตั้งค่า',
            tabGeneral: 'บันทึกทั่วไป',
            tabGeneralMobile: 'บันทึก<br>ทั่วไป',
            tabFixed: 'บันทึกคงที่',
            tabFixedMobile: 'บันทึก<br>คงที่',
            category: 'หมวดหมู่'
        },
        list: {
            summary: '📊 ข้อมูลปัจจุบัน: บันทึกด้วยตนเอง {txLen} รายการ, บันทึกคงที่ {fixLen} รายการ',
            filterAll: 'ทั้งหมด',
            emptyFixed: 'ขณะนี้ยังไม่มีบันทึกคงที่ที่ตรงตามเงื่อนไข',
            emptyGeneral: 'ยังไม่มีบันทึกในเดือนนี้',
            pageInfo: 'หน้า {current} จาก {total} หน้า',
            prevPage: 'หน้าก่อน',
            nextPage: 'หน้าถัดไป',
            pageSizePre: 'หน้าละ',
            pageSizePost: 'รายการ'
        },
        budget: {
            status: 'งบประมาณเดือนนี้ {monthlyBudget} · ใช้ไปแล้ว ${totalExpenseMonth} ({budgetPercent}%)',
            over: 'ใช้เกิน {amount}',
            left: 'คงเหลือ {amount}'
        },
        record: {
            typeIncome: 'รับ',
            typeExpense: 'จ่าย',
            ruleYearly: 'ทุกปีในวันที่ {day} {month}',
            ruleMonthly: 'ทุกเดือนในวันที่ {day}',
            ruleWeekly: 'ทุกสัปดาห์ในวัน{weekday}',
            weekdays: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
            ruleCount: 'รวม {count} รายการ',
            noDeadline: 'ไม่มีกำหนด',
            labelTarget: '👤 เป้าหมาย:',
            labelLocation: '📍 สถานที่:',
            labelNote: '📝 หมายเหตุ:',
            labelPhoto: '📷 แนบรูปภาพแล้ว',
            noNote: 'ไม่มีหมายเหตุ',
            fixedGeneratedTip: 'รายละเอียดที่เกิดจากบันทึกคงที่ สำหรับการดูเท่านั้น',
            addTitle: 'เพิ่มบันทึก',
            copyTitle: 'คัดลอกบันทึก',
            editFixedTitle: 'แก้ไขกฎคงที่',
            viewFixedTitle: 'ดูกฎคงที่',
            addBtn: 'เพิ่ม',
            copyBtn: 'คัดลอก',
            promptLocation: 'กรุณากรอกหรือเลือกสถานที่',
            importantFestivalPrefix: '⭐',
            festivalJoin: ' ',
            attachment: 'ไฟล์แนบ'
        },
        batch: {
            typeNameFixed: 'กฎคงที่',
            typeNameGeneral: 'บันทึกทั่วไป',
            unnamedRule: 'กฎที่ไม่มีชื่อ',
            boundPreview: '- [{name}] ({count} รายการ, เช่น {date})',
            andOthers: '...และอื่น ๆ',
            confirmDeleteFixed: 'คุณแน่ใจหรือไม่ว่าต้องการลบกฎคงที่ {count} ข้อนี้? การกระทำนี้ไม่สามารถยกเลิกได้',
            confirmDeleteFixedBound: '【คำเตือนร้ายแรง】กฎที่คุณเลือกสร้างรายการประวัติจำนวน {totalBound} รายการโดยอัตโนมัติ:\n{boundLines}\n\nการลบกฎจะเป็นการ "ลบพร้อมกัน" ของรายการประวัติเหล่านี้ทั้งหมด!\nหากคุณต้องการหยุดสร้างรายการในอนาคตเท่านั้น ขอแนะนำให้ยกเลิกการลบและแก้ไข "วันที่สิ้นสุด"\n\nคุณแน่ใจหรือไม่ว่าต้องการบังคับลบและทำลายรายการประวัติ?',
            confirmDeleteType: 'คุณแน่ใจหรือไม่ว่าต้องการลบ{typeName} {count} ข้อนี้?',
            btnDeleteSelected: 'ลบที่เลือก ({count})'
        },
        stats: {
            tabs: {
                pie: 'แผนภูมิพาย',
                bar: 'แผนภูมิแท่ง',
                line: 'แผนภูมิเส้น',
                annual: 'แผนภูมิรายปี'
            },
            filters: {
                period: 'ช่วงเวลา:',
                week: 'สัปดาห์',
                month: 'เดือน',
                year: 'ปี',
                all: 'ทั้งหมด',
                custom: 'กำหนดเอง',
                groupby: 'จัดกลุ่มตาม:',
                major: 'หมวดหลัก',
                sub: 'หมวดย่อย',
                payee: 'เป้าหมาย',
                xaxis: 'แกน X:',
                byDay: 'รายวัน',
                byMonth: 'รายเดือน',
                yearLabel: 'ปี:'
            },
            noData: 'ยังไม่มีข้อมูล',
            unclassified: '(ไม่ได้จัดประเภท)',
            unspecified: '(ไม่ได้ระบุ)',
            tableMajor: 'หมวดหลัก',
            tableSub: 'หมวดย่อย',
            tableTarget: 'เป้าหมาย',
            tableAmount: 'จำนวนเงิน',
            tablePercent: 'เปอร์เซ็นต์',
            tableTotal: 'รวม',
            noAnnualRecord: 'ยังไม่มีบันทึกสำหรับปี {year}',
            annualTotalIncome: 'รายได้รวม',
            annualTotalExpense: 'รายจ่ายรวม',
            annualBalance: 'ยอดคงเหลือ',
            monthlyDetails: 'รายละเอียดรายเดือน',
            month: 'เดือน',
            monthSuffix: '',
            year: 'ปี',
            income: 'รายได้',
            expense: 'รายจ่าย',
            top5Expenses: 'รายจ่าย 5 อันดับแรก'
        },
        settings: {

            systemLogs: {
                title: 'บันทึกระบบ (System Logs)',
                desc: 'แสดงบันทึกของคอนโซล 999 รายการล่าสุด เพื่อช่วยแก้ไขปัญหาเกี่ยวกับการเชื่อมต่อหรือการซิงค์ข้อมูล',
                placeholderSearch: 'ค้นหาเวลาหรือคำหลัก...',
                titleCopy: 'คัดลอกบันทึกที่กรองแล้ว',
                btnCopy: 'คัดลอก',
                btnExport: 'ส่งออก',
                titleClear: 'ล้างบันทึก',
                btnClear: 'ล้าง',
                confirmClear: 'คุณแน่ใจหรือไม่ว่าต้องการล้างบันทึกระบบทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้',
                emptyExport: 'ไม่มีบันทึกที่จะส่งออกในขณะนี้',
                emptyCopy: 'ไม่มีบันทึกที่จะคัดลอกในขณะนี้',
                copySuccess: 'คัดลอกบันทึกไปยังคลิปบอร์ดแล้ว',
                copyError: 'การคัดลอกล้มเหลว: {error}'
            },
            language: { title: 'ภาษาที่แสดงผล (Language)' },
            title: 'การตั้งค่าระบบ',
            sponsor: 'สนับสนุนผู้สร้าง',
            theme: {
                title: 'ธีมลักษณะ'
            },
            backup: {
                title: 'สำรองข้อมูลด้วยตนเองและอัตโนมัติ',
                manualExport: 'ส่งออกไฟล์ ZIP',
                manualImport: 'นำเข้าข้อมูลสำรอง',
                importHint: 'รองรับไฟล์รูปแบบ .zip หรือ .json รุ่นเก่า',
                autoExport: 'ขอบเขตการส่งออกแบบอัตโนมัติ',
                daily: 'รายวัน (ข้อมูลในเดือนนี้)',
                yearly: 'ตามปี (ข้อมูลทั้งปี)',
                yearlyAll: 'ทุกปี',
                yearlyCurrent: 'เฉพาะปีนี้',
                yearlyLast: 'ปีที่แล้วและปีนี้',
                includePhotos: 'รวมรูปภาพ (จะเพิ่มขนาดไฟล์อย่างมาก)',
                exporting: 'กำลังเตรียมดาวน์โหลดไฟล์ ZIP...',
                exportSuccess: '✅ สำรองข้อมูลเรียบร้อยแล้ว!\nส่งออกบันทึกทั่วไป {txCount} รายการ, บันทึกคงที่ {fixedCount} รายการ\nรวมหมวดหลัก {catCount} หมวด และเป้าหมาย {tgtCount} เป้าหมาย',
                exportError: 'ส่งออกล้มเหลว: {error}',
                importing: 'กำลังแยกไฟล์สำรอง...',
                importError: 'เกิดข้อผิดพลาดในการกู้คืน: {error}',
                errorJsonParse: 'ไม่สามารถแยกวิเคราะห์ JSON ได้ รูปแบบไฟล์ไม่ถูกต้อง',
                errorOldFormat: 'ไม่รองรับรูปแบบข้อมูลสำรองรุ่นเก่า โปรดใช้ไฟล์สำรองข้อมูลรุ่นล่าสุด',
                errorUnsupportedFile: 'ไม่รองรับรูปแบบไฟล์ กรุณาใช้ไฟล์ .zip หรือ .json',
                gasUrlConflictPrompt: '⚠️ พบ "URL ส่วนตัวสำหรับ GAS" ในไฟล์สำรองข้อมูลที่แตกต่างจากเครื่องของคุณ!\n\n[ข้อมูลสำรอง] {newUrl}\n[เครื่องปัจจุบัน] {oldUrl}\n\nคุณต้องการ "แทนที่" URL ในเครื่องปัจจุบันด้วย URL จากไฟล์สำรองข้อมูลหรือไม่?\n\n(คลิก "ตกลง" เพื่อแทนที่, คลิก "ยกเลิก" เพื่อเก็บ URL ปัจจุบันไว้)',
                parsedTitle: 'แยกไฟล์สำรองข้อมูลสำเร็จแล้ว',
                startImport: 'เริ่มนำเข้า',
                cancel: 'ยกเลิก',
                clearingData: 'กำลังล้างข้อมูลในเครื่อง...',
                deletingRecords: 'กำลังลบระเบียนที่มีอยู่...',
                restoringLocal: 'กำลังกู้คืนข้อมูลลงในเครื่อง...',
                writingDb: 'กำลังเขียนฐานข้อมูล...',
                progressFormat: {
                    wait: 'รอการเขียน{type}... ({current} / {total})',
                    doing: 'กำลังเขียน{type}... ({current} / {total})',
                    done: 'เขียน{type}แล้ว... ({current} / {total})',
                    typeTx: 'บันทึกทั่วไป',
                    typeFixed: 'บันทึกคงที่',
                    typeCat: 'หมวดหมู่',
                    typeTgt: 'เป้าหมาย'
                },
                importComplete: '✅ นำเข้าสำเร็จ!\n\n[เพิ่มใหม่]\n{adds}',
                reloading: 'ระบบกำลังโหลดข้อมูลใหม่...',
                fullBackup: 'ข้อมูลสำรองทั้งหมด:',
                fullBackupDesc: 'บันทึกทั้งหมดของคุณ กฎคงที่ การตั้งค่าหมวดหมู่ และความชอบของปฏิทิน',
                overwriteWarning: 'เมื่อกู้คืนจากคลาวด์ส่วนตัว ข้อมูลที่มีอยู่ในเครื่องจะถูกเขียนทับทั้งหมด',
                exportingTitle: 'กำลังส่งออกข้อมูล',
                advancedTitle: 'การตั้งค่าสำรองข้อมูลขั้นสูง (ใช้สำหรับระบบภายในและคลาวด์)',
                mode: {
                    title: 'โหมดสำรองข้อมูล',
                    daily: 'สำรองรายวัน (ข้อมูลทั้งหมด, เหมาะสำหรับการกู้คืนแบบทับซ้อน)',
                    yearly: 'สำรองรายปี (แยกรายปี, เหมาะสำหรับการกู้คืนแบบรวม)'
                },
                yearlyRange: {
                    title: 'ช่วงสำรองรายปี',
                    all: 'ทุกปี (สำรองทั้งหมด)',
                    current: 'ภายในหนึ่งปีที่ผ่านมา (เฉพาะปีนี้)'
                },
                includePhotos: {
                    title: 'รวมรูปภาพ',
                    desc: 'การยกเลิกการเลือกสามารถลดขนาดของไฟล์สำรองข้อมูลได้มาก'
                },
                restoreMode: {
                    title: 'โหมดกู้คืนข้อมูล (ใช้สำหรับระบบภายในและคลาวด์)',
                    merge: 'ผสานข้อมูล (เก็บข้อมูลเดิมไว้ และข้ามข้อมูลซ้ำ)',
                    overwrite: 'เขียนทับ (ล้างข้อมูลเก่า และทับด้วยข้อมูลใหม่ทั้งหมด)'
                },
                localTitle: 'สำรองข้อมูลด้วยตนเอง (Local ZIP)',
                localDesc: 'ส่งออกบันทึกในรูปแบบไฟล์ ZIP สำรองไปยังอุปกรณ์ของคุณ คุณสามารถกู้คืนข้อมูลได้ในกรณีเปลี่ยนอุปกรณ์ หรือข้อมูลสูญหาย',
                exportBtn: 'ส่งออกสำรอง',
                importBtn: 'นำเข้าสำรอง',
                generateSample: 'สร้างข้อมูลตัวอย่าง'
            },
            cloudBackup: {
                title: 'การซิงค์ข้อมูลกับคลาวด์ส่วนตัว (Google Apps Script)',
                syncing: 'กำลังซิงค์ข้อมูลคลาวด์...',
                desc: 'สำรองข้อมูลรายรับรายจ่ายทั้งหมดของคุณ รวมทั้งข้อมูลเป้าหมาย และการตั้งค่าปฏิทิน\n(*เมื่อกู้คืนจากคลาวด์ส่วนตัว ข้อมูลที่มีอยู่ในเครื่องจะถูกเขียนทับทั้งหมด)',
                successSummary: '✅ สำรองข้อมูลเรียบร้อยแล้ว!\nส่งออกบันทึกทั่วไป {txCount} รายการ, บันทึกคงที่ {fixedCount} รายการ\nรวมหมวดหลัก {catCount} หมวด และเป้าหมาย {tgtCount} เป้าหมาย',
                restoreConfirmMerge: '【โหมดผสานข้อมูล】\nคุณแน่ใจหรือไม่ว่าต้องการผสานข้อมูลนี้ลงในอุปกรณ์?\n(ระบบจะเก็บข้อมูลที่มีอยู่เดิมไว้ และข้ามข้อมูลที่ซ้ำกัน)',
                restoreConfirmOverwrite: '【คำเตือนโหมดเขียนทับ】\nคุณแน่ใจหรือไม่ว่าต้องการใช้ข้อมูลนี้เพื่อเขียนทับข้อมูลทั้งหมดในอุปกรณ์?\n(ข้อมูลเก่าทั้งหมดจะถูกลบออก!)',
                restoreConfirmEmpty: '【กู้คืนข้อมูล】\nคุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลคลาวด์นี้ลงในอุปกรณ์?',
                restoreSummary: 'ข้อมูลสำรองนี้ประกอบด้วย:\n- บันทึกทั่วไป: {txCount} รายการ\n- บันทึกคงที่: {fixedCount} รายการ\n- การตั้งค่าหมวดหมู่: {catCount} รายการ\n- การตั้งค่าเป้าหมาย: {tgtCount} รายการ\n',
                restoreFiltered: '\n(ข้ามข้อมูลที่ซ้ำกันอัตโนมัติ)\n',
                restoreFilteredTx: '- บันทึกทั่วไป: {txSkip} รายการ\n',
                restoreFilteredFixed: '- บันทึกคงที่: {fixedSkip} รายการ\n',
                restoreFilteredCat: '- การตั้งค่าหมวดหมู่: {catSkip} รายการ\n',
                restoreFilteredTgt: '- การตั้งค่าเป้าหมาย: {tgtSkip} รายการ\n',
                restoreCompleteEmpty: '✅ กู้คืนข้อมูลจากคลาวด์เสร็จสิ้น!\n\n【เพิ่มใหม่】\n{adds}\n\nระบบกำลังโหลดข้อมูลใหม่...',
                restoreCompleteOverwrite: '✅ กู้คืนข้อมูลจากคลาวด์เสร็จสิ้น (โหมดเขียนทับ)!\n\n【เพิ่มใหม่】\n{adds}\n\nระบบกำลังโหลดข้อมูลใหม่...',
                restoreCompleteMerge: '✅ กู้คืนข้อมูลจากคลาวด์เสร็จสิ้น (โหมดผสานข้อมูล)!\n\n【เพิ่มใหม่】\n{adds}',
                restoreCompleteMergeSkipped: '\n\n(ข้ามข้อมูลซ้ำโดยอัตโนมัติ)\n',
                addedTx: 'บันทึกทั่วไป {tx} รายการ',
                addedFixed: 'บันทึกคงที่ {fixed} รายการ',
                addedCat: 'การตั้งค่าหมวดหมู่ {cat} รายการ',
                addedTgt: 'การตั้งค่าเป้าหมาย {tgt} รายการ'
            },
            accounts: {
                title: 'การตั้งค่าพารามิเตอร์บัญชี',
                add: 'เพิ่มบัญชี',
                edit: 'แก้ไขบัญชี',
                defaultAccountName: 'บัญชี A',
                accountName: 'ชื่อบัญชี',
                accountNamePh: 'ตัวอย่าง: เงินสด, บัตรเครดิต',
                requireName: 'กรุณากรอกชื่อบัญชี',
                tagColor: 'สีป้ายกำกับ',
                monthlyBudget: 'งบประมาณต่อเดือน',
                budgetPh: 'ตัวอย่าง: 25000',
                save: 'บันทึก',
                budget: 'งบประมาณต่อเดือน: ${amount}',
                isDefault: 'ค่าเริ่มต้น',
                setDefault: 'ตั้งเป็นค่าเริ่มต้น',
                deleteConfirmTitle: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?',
                deleteErrorMsg: 'ไม่สามารถลบได้! บัญชีนี้ยังคงมี:\n',
                deleteErrorTxs: '- บันทึกทั่วไป {count} รายการ (มีอยู่ใน {dates})\n',
                deleteErrorFixed: '- บันทึกคงที่ {count} รายการ\n',
                deleteErrorEnd: '\nกรุณาโอนย้ายรายการเหล่านี้ไปยังบัญชีอื่นก่อน หรือลบรายการเหล่านี้เพื่อลองอีกครั้ง.'
            },
            dataManagement: {
                title: 'การจัดการข้อมูลการทำรายการ',
                expense: 'หมวดหมู่รายจ่าย',
                income: 'หมวดหมู่รายได้',
                target: 'เป้าหมาย'
            },
            calendar: {
                title: 'ปฏิทินและการแสดงผล',
                remindDaysBefore: 'เตือนล่วงหน้า (วัน):',
                monthSuffix: 'เดือน',
                daySuffix: 'วัน',
                month: 'เดือน {m}',
                day: 'วันที่ {d}',
                monthPh: 'เดือน',
                dayPh: 'วัน',
                festivalNamePh: 'กรุณากรอกชื่อเทศกาล',
                dayNumPh: 'จำนวนวัน {n}',
                nationalHoliday: {
                    title: 'วันหยุดนักขัตฤกษ์ (สำหรับไต้หวันเท่านั้น)',
                    desc: 'แสดงวันหยุดที่ประกาศโดยสำนักการบริหารส่วนบุคคล',
                    lastUpdated: 'อัปเดตล่าสุด: ',
                    neverUpdated: 'ไม่มี',
                    updateNow: 'อัปเดตตอนนี้',
                    updating: 'กำลังดาวน์โหลด...',
                    updateSuccess: '✅ อัปเดตวันหยุดเรียบร้อยแล้ว!\nดาวน์โหลดข้อมูลวันหยุดของปี {years} จำนวน {count} รายการ',
                    updateSuccessLog: '[การตั้งค่าระบบ] สำเร็จในการอัปเดตข้อมูลวันหยุด ({years}) จำนวน {count} รายการ',
                    updateError: '❌ การดาวน์โหลดล้มเหลว: {error}'
                },
                lunarDate: {
                    title: 'วันที่ตามจันทรคติ (ประเพณีจีน)',
                    desc: 'แสดงวันที่ตามจันทรคติ (ตัวอย่าง: วันแรก, วันที่สิบห้า)'
                },
                stembranch: {
                    title: 'สเต็มและสาขา (ประเพณีจีน)',
                    desc: 'แสดงกิ่งก้านรายวัน (ตัวอย่าง: Jiazi, Yichou)'
                },
                solarterm: {
                    title: '24 ฤดูกาล (ประเพณีจีน)',
                    desc: 'แสดงชื่อฤดูกาลของวัน (ตัวอย่าง: ลี่ชุน, ชิงหมิง)'
                },
                festival: {
                    title: 'เทศกาล (ประเพณีจีน)',
                    desc: 'แสดงเทศกาลประเพณีและวันรำลึกท้องถิ่น (ตรุษจีน, เทศกาลเรือมังกร ฯลฯ)'
                },
                globalFestival: {
                    title: 'เทศกาล (ทั่วโลก)',
                    desc: 'แสดงเทศกาลสากลและตะวันตก (วันปีใหม่, คริสต์มาส ฯลฯ)'
                },
                bazi: {
                    title: 'ดวงจีนแปดตัวอักษร (ประเพณีจีน)',
                    desc: 'เมื่อคลิกที่วัน จะแสดงเสาสี่เสา, เทพทั้งสิบ, ซ่อนเร้น, หยินยิง'
                },
                valentine: {
                    title: 'เทศกาลวันวาเลนไทน์น่าสนใจ',
                    desc: 'แสดงเทศกาลวันวาเลนไทน์ต่างๆ ในวันที่ 14 ของทุกเดือน (รวม 14/2 วาเลนไทน์สากล, วาเลนไทน์สีขาว, วาเลนไทน์สีดำ ฯลฯ)'
                },
                importantFestival: {
                    title: 'ตั้งค่าเตือนความจำเทศกาลสำคัญ',
                    enableTitle: 'เปิดใช้การแจ้งเตือนเทศกาลสำคัญ',
                    enableDesc: 'เมื่อเทศกาลใกล้มาถึง จะแจ้งเตือนอัตโนมัติเวลาบันทึกรายการ และจะแสดงเครื่องหมายดาวบนปฏิทิน',
                    addBtn: 'เพิ่มเทศกาล (มากสุด 10 เทศกาล)'
                }
            },
            photoUpload: {
                title: 'อัปโหลดรูปภาพ',
                enableTitle: 'เปิดใช้งานการถ่ายและอัปโหลดภาพ',
                enableDesc: 'เปิดเพื่อให้สามารถแนบภาพเมื่อบันทึกรายการ',
                maxSize: 'ขนาดรูปภาพใหญ่สุด',
                size320: '320 x 320',
                size480: '480 x 480 (ขั้นต่ำที่แนะนำ)',
                size640: '640 x 640 (ค่าเริ่มต้น)',
                size800: '800 x 800',
                size1024: '1024 x 1024',
                quality: 'คุณภาพการบีบอัด JPEG',
                qual03: '0.3 (บีบอัดสูง)',
                qual05: '0.5 (ขั้นต่ำที่แนะนำ)',
                qual07: '0.7 (ค่าเริ่มต้น)',
                qual09: '0.9 (บีบอัดต่ำ)'
            },
            mapLink: {
                title: 'ตำแหน่งจาก Google Map',
                enableTitle: 'ลิ้งก์แผนที่ในรายการสถานที่',
                enableDesc: 'เปิดให้สามารถกดที่ชื่อสถานที่ในหน้ารายการ เพื่อเปิดแผนที่ได้ทันที'
            },
            about: {
                title: 'เกี่ยวกับ',
                licenseTitle: 'ซอร์สโค้ดเปิดและใบอนุญาต',
                licenseDesc: 'ดูซอฟต์แวร์ของบุคคลที่สามแบบเปิดที่ใช้ในโปรเจกต์นี้',
                openSourceLicense: 'ใบอนุญาต Open Source (MIT License)',
                visualAssetsCopyright: 'คำประกาศลิขสิทธิ์ทรัพย์สินภาพ',
                visualAssetsDesc: 'ซอร์สโค้ดพื้นฐานของโปรเจกต์นี้ได้รับการเผยแพร่ภายใต้ MIT License.<br><br>อย่างไรก็ตาม ทุกเอกลักษณ์ของแบรนด์ การออกแบบ UI ไอคอน และทรัพย์สินภาพต่างๆ ที่รวมอยู่ในซอฟต์แวร์นี้ เป็นลิขสิทธิ์ทั้งหมดโดยผู้เขียนเดิม <strong class="text-rose-600 dark:text-rose-400 font-semibold">และไม่ได้อยู่ภายใต้</strong> MIT License ดังกล่าวข้างต้น.<br><br>การลอกเลียนแบบ การทำซ้ำ การแจกจ่าย หรือการใช้ทรัพย์สินภาพดังกล่าวเพื่อโปรเจกต์อื่น หรือเพื่อวัตถุประสงค์เชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากผู้เขียนถือเป็นเรื่องต้องห้ามโดยเด็ดขาด.',
                poweredBy: 'เทคโนโลยีและซอฟต์แวร์ Open Source'
            },

            categories: {
                title: 'จัดการหมวดหมู่',
                selectAll: 'เลือกทั้งหมด',
                cascadeUpdateConfirm: 'การกระทำนี้จะอัปเดตบันทึกประวัติศาสตร์ทั้งหมดที่ใช้ 「{oldValue}」\nให้เปลี่ยนเป็น 「{newValue}」 คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?',
                cascadeUpdateTitle: 'ยืนยันการอัปเดตต่อเนื่อง',
                confirmUpdate: 'ยืนยันเพื่ออัปเดต',
                cancel: 'ยกเลิก',
                noData: 'ไม่มีข้อมูล กรุณาเพิ่ม',
                addExpenseMajor: 'เพิ่มหมวดหลักรายจ่าย',
                addIncomeMajor: 'เพิ่มหมวดหลักรายได้',
                promptNewMajor: 'ระบุชื่อหมวดหลักใหม่:',
                deleteSelected: '🗑️ ลบที่เลือก ({count})',
                addMinor: 'เพิ่มหมวดย่อย',
                promptNewMinor: 'ระบุชื่อหมวดย่อยใหม่:',
                deleteInUseMsg: 'ไม่สามารถลบได้! หมวดหมู่นี้ถูกใช้อยู่ใน:\n',
                deleteInUseTx: '- รายการทั่วไป {count} รายการ (ในวันที่ {dates}{more})\n',
                deleteInUseFixed: '- กฎคงที่ {count} รายการ ({names}{more})\n',
                deleteInUseTail: '\nกรุณาลบรายการเหล่านี้หรืออัปเดตไปเป็นหมวดหมู่อื่นก่อนแล้วลองอีกครั้ง.',
                editSub: 'แก้ไขหมวดย่อย',
                deleteSub: 'ลบหมวดย่อย',
                moreDays: ' รวมทั้งสิ้น {count} วัน',
                etc: ' และอื่นๆ',
                deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? การกระทำนี้ไม่สามารถยกเลิกได้',
                expenseTitle: 'จัดการหมวดหมู่รายจ่าย',
                incomeTitle: 'จัดการหมวดหมู่รายได้',
                deleteBatchConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหลัก {majorCount} รายการ และหมวดย่อย {minorCount} รายการ รวมทั้งสิ้น {total} รายการ?\n(หมายเหตุ: การลบหมวดหลักจะเป็นการลบหมวดย่อยที่เกี่ยวข้องทั้งหมดด้วย)',
                deleteBatchConfirmMinorOnly: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดย่อย {count} รายการ?',
                deleteBatchConfirmMajorOnly: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหลัก {count} รายการ?\n(หมายเหตุ: การลบหมวดหลักจะเป็นการลบหมวดย่อยที่เกี่ยวข้องทั้งหมดด้วย)',
                deleteBatchInUseMsg: 'ไม่สามารถลบได้! หมวดหมู่ต่อไปนี้ถูกใช้อยู่:\n',
                deleteBatchInUseMinorItem: '- หมวดย่อย [{major} > {sub}] ({details})',
                deleteBatchInUseMajorItem: '- หมวดหลัก [{major}] ({details})',
                deleteBatchInUseTxDetail: '{count} รายการ (เช่น {date})',
                deleteBatchInUseFixedDetail: '{count} กฎ',
                deleteBatchInUseMore: '\n...และอื่นๆ',
                deleteBatchInUseTail: '\n\nกรุณาลบรายการเหล่านี้หรืออัปเดตไปเป็นหมวดหมู่อื่นก่อนแล้วลองอีกครั้ง.'
            },
            targets: {
                title: 'เป้าหมายการใช้จ่าย',
                addTarget: 'เพิ่มเป้าหมาย',
                selectAll: 'เลือกทั้งหมด',
                noData: 'ไม่มีข้อมูล กรุณาเพิ่ม',
                noDataSimple: 'ไม่มีข้อมูล',
                deleteSelected: '🗑️ ลบที่เลือก ({count})',
                deleteInUseMsg: 'ไม่สามารถลบได้! เป้าหมายนี้ถูกใช้อยู่ใน:\n',
                deleteInUseTx: '- รายการทั่วไป {count} รายการ (ในวันที่ {dates}{more})\n',
                deleteInUseFixed: '- กฎคงที่ {count} รายการ ({names}{more})\n',
                deleteInUseTail: '\nกรุณาลบรายการเหล่านี้หรืออัปเดตไปเป็นเป้าหมายอื่นก่อนแล้วลองอีกครั้ง.',
                moreDates: ' รวมทั้งสิ้น {count} วัน',
                deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้? การกระทำนี้ไม่สามารถยกเลิกได้',
                promptNewTarget: 'ระบุชื่อเป้าหมายใหม่:',
                duplicateAlert: 'ชื่อเป้าหมาย 「{name}」 มีอยู่แล้ว!',
                reorderTitle: 'โปรดเลือกลำดับ (ตัวเลขที่น้อยกว่าจะมาก่อน)',
                deleteBatchInUseMsg: 'ไม่สามารถลบได้! เป้าหมายต่อไปนี้ถูกใช้อยู่:\n',
                deleteBatchInUseItem: '- เป้าหมาย [{name}] ({details})',
                deleteBatchInUseMore: '\n...และอื่นๆ',
                deleteBatchInUseTail: '\n\nกรุณาลบรายการเหล่านี้หรืออัปเดตไปเป็นเป้าหมายอื่นก่อนแล้วลองอีกครั้ง.',
                deleteBatchConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมาย {count} รายการ? การกระทำนี้ไม่สามารถยกเลิกได้',
                cascadeUpdateTitle: 'ยืนยันการอัปเดตต่อเนื่อง',
                cascadeUpdateConfirm: 'ต้องการอัปเดตบันทึกที่มีเป้าหมาย 「{oldValue}」 ให้เปลี่ยนเป็น 「{newValue}」 ด้วยหรือไม่?',
                confirmUpdate: 'อัปเดตต่อเนื่อง'
            },
            accountA: 'บัญชี A',
            defaultBadge: 'ค่าเริ่มต้น',
            monthlyBudget: 'งบประมาณต่อเดือน: ${amount}',
            setDefault: 'ตั้งเป็นค่าเริ่มต้น',
            deleteAccountError: 'ไม่สามารถลบได้! บัญชีนี้ยังคงมี:\n{boundTxs}{boundFixed}\nกรุณาโอนย้ายรายการเหล่านี้ไปยังบัญชีอื่น หรือลบรายการเหล่านี้ก่อนแล้วลองอีกครั้ง.',
            deleteAccountErrorTx: '- บันทึกทั่วไป {count} รายการ (ในวันที่ {displayDates}{moreStr})\n',
            deleteAccountErrorMoreDates: ' รวมทั้งสิ้น {count} วัน',
            deleteAccountErrorFixed: '- บันทึกคงที่ {count} รายการ\n',
            confirmDeleteAccount: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?',
            editAccountError: 'เกิดข้อผิดพลาดในการแก้ไขบัญชี: {error}',
            addAccountError: 'เกิดข้อผิดพลาดในการเพิ่มบัญชี: {error}',
            modalAddAccount: 'เพิ่มบัญชี',
            modalEditAccount: 'แก้ไขบัญชี',
            modalAccountName: 'ชื่อบัญชี',
            modalLabelColor: 'สีป้ายกำกับ',
            modalSave: 'บันทึก',
            festivalMonth: 'เดือน',
            festivalDay: 'วัน',
            festivalName: 'ชื่อเทศกาล (เช่น วันครบรอบ)',
            festivalReminder: 'แจ้งเตือน (ล่วงหน้า X วัน):',
            festivalDays1: 'วัน 1',
            festivalDays2: 'วัน 2',
            festivalDays3: 'วัน 3',
            downloading: 'กำลังดาวน์โหลด...',
            lastUpdated: 'อัปเดตล่าสุด: {date}',
            lastUpdatedNever: 'อัปเดตล่าสุด: ไม่เคย',
            holidayUpdateSuccess: '✅ อัปเดตข้อมูลวันหยุดนักขัตฤกษ์สำเร็จ!\nดาวน์โหลดวันหยุดไปแล้ว {count} วัน ในปี {years}.',
            holidayUpdateFail: '❌ การดาวน์โหลดล้มเหลว: {error}',
            holidayUpdateFailUnknown: 'ข้อผิดพลาดที่ไม่ทราบ',
            btnUpdateHoliday: 'อัปเดตวันหยุดนักขัตฤกษ์',
            backupSuccess: '✅ สำรองข้อมูลเรียบร้อยแล้ว!\nส่งออกบันทึกทั่วไป {txCount} รายการ, บันทึกคงที่ {fixedCount} รายการ\nรวมหมวดหลัก {catCount} หมวด และเป้าหมาย {tgtCount} เป้าหมาย',
            restoreConfirmWarningLocalEmpty: '【กู้คืนข้อมูล】\nคุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลคลาวด์นี้ลงในอุปกรณ์?',
            restoreConfirmWarningOverwrite: '【คำเตือนโหมดเขียนทับ】\nคุณแน่ใจหรือไม่ว่าต้องการใช้ข้อมูลนี้เพื่อเขียนทับข้อมูลทั้งหมดในอุปกรณ์?\n(ข้อมูลเก่าทั้งหมดจะถูกลบออก!)',
            restoreConfirmWarningMerge: '【โหมดผสานข้อมูล】\nคุณแน่ใจหรือไม่ว่าต้องการผสานข้อมูลนี้ลงในอุปกรณ์?\n(ระบบจะเก็บข้อมูลที่มีอยู่เดิมไว้ และข้ามข้อมูลที่ซ้ำกัน)',
            restoreConfirmMsg: 'ข้อมูลสำรองนี้ประกอบด้วย:\n- บันทึกทั่วไป: {totalTx} รายการ\n- บันทึกคงที่: {totalFixed} รายการ\n- การตั้งค่าหมวดหมู่: {totalCat} รายการ\n- การตั้งค่าเป้าหมาย: {totalTgt} รายการ\n',
            restoreConfirmMsgFilter: '\n(ข้ามข้อมูลซ้ำโดยอัตโนมัติ)\n',
            restoreConfirmMsgFilterTx: '- บันทึกทั่วไป: {count} รายการ\n',
            restoreConfirmMsgFilterFixed: '- บันทึกคงที่: {count} รายการ\n',
            restoreConfirmMsgFilterCat: '- การตั้งค่าหมวดหมู่: {count} รายการ\n',
            restoreConfirmMsgFilterTgt: '- การตั้งค่าเป้าหมาย: {count} รายการ\n',
            inputNamePlaceholder: 'เช่น เงินสด, บัตรเครดิต',
            inputBudgetPlaceholder: 'เช่น 25000',
            requireAccountName: 'กรุณากรอกชื่อบัญชี'
        },
        modals: {
            accountFilter: {
                title: 'กรองบัญชี',
                selectLabel: 'เลือกบัญชีที่ต้องการแสดง',
                selectAll: 'เลือกทั้งหมด',
                clearAll: 'ไม่เลือกทั้งหมด',
                confirm: 'ยืนยัน'
            },
            crop: {
                title: 'ตัดรูปภาพ',
                warning: '⚠️ การตัดรูปซ้ำจะทำให้คุณภาพรูปภาพลดลง',
                cancel: 'ยกเลิก',
                confirm: 'ยืนยันการตัดรูป'
            },
            photoHelp: {
                title: 'คำแนะนำการตั้งค่าคุณภาพรูปภาพ',
                p1: 'ความละเอียด 320x320 พร้อมคุณภาพ 0.3 จะทำให้รูป "เบลอมาก" หากต้องการรูปเพื่อใช้เพียงเป็นตัวแทนเช่น "นี่คือกาแฟ" ก็พอจะใช้ได้ แต่หากเป็นการถ่ายใบเสร็จ ตัวหนังสืออาจเบลอจนอ่านไม่รู้เรื่อง',
                p2: 'ขอแนะนำให้ตั้งค่าคุณภาพไว้อย่างน้อย <strong style="color: var(--primary-color);">480x480 / คุณภาพ 0.5</strong> เพื่อให้เห็นตัวเลขได้ชัดเจนขึ้น',
                estimateTitle: 'ขนาดที่คาดเดาของแต่ละไฟล์ (หลังจากบันทึกลงในฐานข้อมูล)',
                li1: '320x320 / คุณภาพ 0.3: ประมาณ 10~20 KB <span style="font-size: 0.8rem;">(เล็กมาก แต่เบลอมาก)</span>',
                li2: '480x480 / คุณภาพ 0.5: ประมาณ 15~30 KB',
                li3: '640x640 / คุณภาพ 0.7: ประมาณ 40~60 KB <strong style="color: var(--text-main); font-weight: 500;">(เริ่มต้น ความชัดเจนดี)</strong>',
                li4: '1024x1024 / คุณภาพ 0.9: ประมาณ 150~250 KB <span style="font-size: 0.8rem;">(ชัดเจนมาก แต่ใช้พื้นที่มากกว่า)</span>',
                understand: 'เข้าใจแล้ว'
            },
            record: {
                editTitle: 'แก้ไขบันทึก',
                tabExpense: 'จ่าย',
                tabIncome: 'รับ',
                tabSingle: 'ครั้งเดียว',
                tabFixed: 'คงที่',
                date: 'วันที่',
                dateRange: 'ช่วงวันที่',
                startDate: 'วันที่เริ่มต้น',
                endDate: 'วันที่สิ้นสุด',
                amount: 'จำนวนเงิน',
                repeatType: 'ประเภทการซ้ำ',
                ruleYearly: 'ทุกปี',
                ruleMonthly: 'ทุกเดือน',
                ruleWeekly: 'ทุกสัปดาห์',
                ruleDetail: 'รายละเอียดกฎ',
                monday: 'วันจันทร์',
                tuesday: 'วันอังคาร',
                wednesday: 'วันพุธ',
                thursday: 'วันพฤหัสบดี',
                friday: 'วันศุกร์',
                saturday: 'วันเสาร์',
                sunday: 'วันอาทิตย์',
                majorCat: 'หมวดหลัก',
                subCat: 'หมวดย่อย',
                target: 'เป้าหมาย',
                location: 'สถานที่',
                locationPlaceholder: 'ป้อนที่อยู่ หรือชื่อร้านค้า',
                mapTitle: 'เปิดในแผนที่',
                photo: 'รูปภาพ',
                photoUpload: 'ถ่ายรูป หรืออัปโหลดรูปภาพ',
                photoPreview: 'ภาพตัวอย่าง',
                photoRecrop: 'คลิกเพื่อตัดรูปอีกครั้ง',
                photoDelete: 'ลบรูปภาพ',
                note: 'หมายเหตุ',
                notePlaceholder: 'หมายเหตุ...',
                btnDelete: 'ลบ',
                btnCopy: 'คัดลอก',
                btnSave: 'บันทึก',
                btnCancel: 'ยกเลิก'
            }
        },
        globalFestivals: {
            newYear: 'วันขึ้นปีใหม่',
            valentinesDay: 'วันวาเลนไทน์',
            womensDay: 'วันสตรีสากล',
            foolsDay: 'วันเอพริลฟูลส์',
            earthDay: 'วันคุ้มครองโลก',
            laborDay: 'วันแรงงาน',
            halloween: 'วันฮาโลวีน',
            christmas: 'วันคริสต์มาส',
            mothersDay: 'วันแม่',
            thanksgiving: 'วันขอบคุณพระเจ้า',
            easter: 'วันอีสเตอร์',
            internationalCoopDay: 'วันสหกรณ์สากล',
            captiveNationsWeek: 'สัปดาห์ประเทศที่ถูกกดขี่',
            diaryValentinesDay: 'วันไดอารี่วาเลนไทน์',
            westernValentinesDay: 'วันวาเลนไทน์',
            whiteValentinesDay: 'ไวท์เดย์',
            blackValentinesDay: 'แบล็คเดย์',
            roseValentinesDay: 'วันโรสวาเลนไทน์',
            kissValentinesDay: 'วันจูบวาเลนไทน์',
            silverValentinesDay: 'วันซิลเวอร์วาเลนไทน์',
            greenValentinesDay: 'วันกรีนวาเลนไทน์',
            photoValentinesDay: 'วันโฟโต้วาเลนไทน์',
            wineValentinesDay: 'วันไวน์วาเลนไทน์',
            movieValentinesDay: 'วันมูฟวี่วาเลนไทน์',
            hugValentinesDay: 'วันฮักวาเลนไทน์'
        },
        calendar: {
            weekdays: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
            months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
            lunarDays: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'],
            lunarMonths: ['1','2','3','4','5','6','7','8','9','10','11','12'],
            lunarLeap: 'อธิกมาส',
            lunarMonthSuffix: 'เดือน',
            dayDetail: {
                txTitle: 'รายการประจำวัน',
                closeBtn: 'ปิดรายละเอียด'
            },
            recordOf: 'บันทึกของ',
            noRecord: 'ยังไม่มีบันทึกในวันนี้',
            baziDayMaster: 'หลักวัน',
            baziYearPillar: 'เสาปี',
            baziMonthPillar: 'เสาเดือน',
            baziDayPillar: 'เสาวัน',
            baziNote: '* แผนภูมินี้ไม่ได้รวมเสาเวลา'
        }
    },
    systemLogs: {
        taiwanHolidays: {
            localStorageFormatError: '[ปฏิทิน] ข้อผิดพลาดรูปแบบข้อมูล localStorage ({func}) ข้ามการทำงาน',
            loadPersistedError: '[ปฏิทิน] โหลดข้อมูลวันหยุดในเครื่องล้มเหลว ({func}):',
            noDataYet: '[ปฏิทิน] ยังไม่ได้โหลดข้อมูลวันหยุดประจำปีสำหรับ {year}',
            fetchError: '[API] โหลดข้อมูลวันหยุดจากรัฐบาลล้มเหลว ({func} - {year}):',
            downloadError: '[API] ดาวน์โหลดข้อมูลวันหยุดจากรัฐบาลล้มเหลว ({year}):',
            saveLocalStorageError: '[ปฏิทิน] ล้มเหลวในการบันทึก localStorage:',
            updateUnexpectedError: '[API] ข้อผิดพลาดที่ไม่คาดคิดเมื่อพยายามอัปเดตวันหยุดนักขัตฤกษ์:'
        },
        themeSwitcher: {
            readCustomThemeError: '[ธีมลักษณะ] ไม่สามารถอ่านธีมลักษณะที่ปรับแต่งเองได้:',
            containerNotFound: '[ธีมลักษณะ] ไม่พบตัวบรรจุธีมลักษณะ: {containerId}',
            switchedTheme: '[ธีมลักษณะ] เปลี่ยนธีมลักษณะผ่านเมนูเป็น: {newTheme}'
        }
    }
};

