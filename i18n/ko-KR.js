export default {
    categories: {
        expense: {
            food: '식비',
            family: '가족/생활',
            medical: '의료/건강',
            clothing: '의류/미용',
            device: '전자기기',
            transport: '교통/통신',
            entertainment: '문화/여가',
            education: '교육/교제',
            tax: '세금/이자',
            other: '기타 지출'
        },
        income: {
            salary: '급여',
            investment: '투자/재테크',
            other: '기타 수입'
        }
    },
    targets: {
        self: '나',
        husband: '남편',
        wife: '아내',
        child: '자녀',
        grandpa: '할아버지',
        grandma: '할머니',
        family: '가족 전체',
        other: '기타'
    },
    subcategories: {
        expense: {
            food: { breakfast: '아침', lunch: '점심', dinner: '저녁', midnight: '야식', drink: '음료/커피', noodle: '컵라면', snack: '간식', bread: '빵/베이커리' },
            family: { allowance: '용돈', water: '수도세', electricity: '전기세', phone: '통신비', internet: '인터넷', furniture: '가구', appliance: '가전제품', cleaning: '청소용품', mortgage: '주택 대출', mall: '쇼핑몰' },
            medical: { insurance: '보험료', medical: '진료비/약값', supplement: '건강보조제' },
            clothing: { coat: '외투/코트', clothes: '옷', pants: '바지', skirt: '치마', shoes: '신발', hat: '모자', scarf: '목도리', gloves: '장갑', underwear: '속옷', underpants: '팬티', socks: '양말', contacts: '렌즈' },
            device: { computer: '컴퓨터/노트북', phone: '스마트폰', tablet: '태블릿', console: '게임기', accessories: '주변기기/액세서리' },
            transport: { train: '기차표', hsr: 'KTX/SRT', mrt: '지하철', taxi: '택시', accommodation: '숙박비', ticket: '입장권', parking: '주차비', gas: '주유비', maintenance: '차량 정비' },
            entertainment: { movie: '영화', pinball: '오락실', balloon: '사격/풍선', claw: '인형뽑기', karaoke: '노래방', gacha: '가챠/랜덤박스', game: '게임 과금' },
            education: { books: '도서', course: '강의/학원', exam: '시험 응시료', dine: '회식/모임', gift: '선물', red_envelope: '경조사비' },
            tax: { nhi: '건강보험', labor: '고용산재보험', national: '국민연금', business: '영업세', license: '자동차세', income: '종합소득세', house: '재산세(주택)', fuel: '유류세', land: '재산세(토지)' },
            other: { misc: '잡비', lost: '분실/손실', unclassified: '미분류' }
        },
        income: {
            salary: { base: '기본급', bonus: '성과급/보너스', festival: '명절 상여', overtime: '야근수당', parttime: '아르바이트' },
            investment: { stock: '주식', dividend: '배당금', interest: '예적금 이자', fund: '펀드 수익', crypto: '가상화폐/FX' },
            other: { gift: '축의금/용돈', refund: '환불금', lottery: '복권 당첨', subsidy: '보조금/지원금' }
        }
    },

    logs: {
        /* duplicate removed */
        db: {
            migrationStart: '[데이터베이스] i18n 카테고리 코드화 마이그레이션 시작...',
            migrationSuccess: '[데이터베이스] i18n 카테고리 코드화 마이그레이션 완료!',
            migrationFail: '[데이터베이스] i18n 카테고리 코드화 마이그레이션 실패: {error}',
            error: '[데이터베이스] 오류:',
            saveCategorySuccess: '[데이터베이스] 카테고리 설정(saveCategory) 저장 성공',
            deleteCategorySuccess: '[데이터베이스] 카테고리 설정(deleteCategory) 삭제 성공',
            saveTargetSuccess: '[데이터베이스] 대상 설정(saveTarget) 저장 성공',
            deleteTargetSuccess: '[데이터베이스] 대상 설정(deleteTarget) 삭제 성공',
            saveTransactionSuccess: '[데이터베이스] 거래 기록(saveTransaction) 저장 성공',
            batchSaveTransactionsSuccess: '[데이터베이스] 일괄 거래 기록(batchSaveTransactions) 저장 성공',
            batchSaveTransactionsFail: '[데이터베이스] 일괄 거래 기록 저장 실패:',
            deleteTransactionSuccess: '[데이터베이스] 거래 기록(deleteTransaction) 삭제 성공',
            deleteTransactionsByFixedIdSuccess: '[데이터베이스] 고정 규칙 관련 기록 일괄 삭제(deleteTransactionsByFixedId) 성공',
            saveFixedRecordSuccess: '[데이터베이스] 고정 규칙(saveFixedRecord) 저장 성공',
            batchSaveFixedRecordsSuccess: '[데이터베이스] 고정 규칙 일괄 저장(batchSaveFixedRecords) 성공',
            batchSaveFixedRecordsFail: '[데이터베이스] 고정 규칙 일괄 저장 실패:',
            deleteFixedRecordSuccess: '[데이터베이스] 고정 규칙(deleteFixedRecord) 삭제 성공'
        },
        calendar: {
            holidayLoadError: '{year}년 공휴일 데이터를 불러올 수 없습니다.',
            loadHolidaysFail: '[캘린더] 해당 연도의 공휴일 데이터를 불러올 수 없습니다...'
        },
        settings: {
            forceClearComplete: '[설정] 강제 초기화 완료, IndexedDB 및 {removed} 개의 localStorage 항목이 삭제되었습니다({kept} 개의 시스템 설정은 유지됨)',
            accountUpdateSuccess: '[설정] 계정 설정 업데이트(saveAccounts) 성공',
            checkAccountDataError: '[설정] 계정 데이터 확인 중 오류 발생:',
            backupUpdateSuccess: '[설정] 프라이빗 클라우드 설정 및 동기화 상태 저장 성공',
            saveAccountsSuccess: '[설정] 계정 설정 업데이트(saveAccounts) 성공',
            cloudBackupSuccess: '[설정] 프라이빗 클라우드 설정 및 동기화 상태 저장 성공',
            restoreError: '복원 중 오류가 발생했습니다:',
            exportJsonSuccess: '[백업] 수동 로컬 백업 내보내기 성공: ZIP 크기 ',
            fileReadError: '파일 읽기 실패',
            importJsonSuccess: '[백업] 로컬 백업에서 가져오기 성공: 추가/업데이트 ',
            checkAccountError: '[설정] 계정 데이터 확인 중 오류 발생:',
            checkCategoryError: '[설정] 카테고리 데이터 확인 중 오류 발생:',
            checkCategoryBatchError: '[설정] 카테고리 데이터 일괄 확인 중 오류 발생:',
            checkTargetError: '[설정] 대상 데이터 확인 중 오류 발생:',
            checkTargetBatchError: '[설정] 대상 데이터 일괄 확인 중 오류 발생:',
            keptKeyGmaps: 'Google Maps API 키',
            keptKeyGas: '프라이빗 클라우드 GAS 설정',
            keptKeyI18n: 'i18n 마이그레이션 플래그',
            keptKeyLang: '언어 설정'
        },
        record: {
            festivalReminderError: '[주요 기념일 알림] 오류:',
            saveFail: '[기록] 저장 실패:'
        },
        location: {
            fetchPlaceInfoFail: '[장소 검색] 전체 장소 정보를 가져올 수 없습니다:',
            apiLoadFail: '[장소 검색] Google Maps API 로드 실패...'
        },
        app: {
            alreadyInitialized: '[메인 프로그램] app.js가 이미 초기화되었습니다. 중복 실행을 건너뜁니다...'
        },
        htmlLoader: {
            loadFail: '[HTML 로더] 로드 실패',
            fetchFail: '[HTML 로더] 가져오기 실패'
        }
    },
    ui: {
        common: {
            unnamed: '(이름 없음)'
        },
        footer: {
            unnamedProject: '이름 없는 프로젝트',
            githubProject: 'GitHub',
            releaseDate: '출시일: {date}'
        },
        app: {
            name: 'TinyLedger',
            fullName: '작은 가계부'
        },
        accounts: {
            defaultName: '기본 계정',
            colors: {
                blue: '파란색', green: '초록색', red: '빨간색', yellow: '노란색', purple: '보라색', gray: '회색'
            },
            filterAll: '전체',
            filterPartial: '({selected}/{total})',
            alertNoAccount: '적어도 하나의 계정을 선택해 주세요!'
        },
        tabs: {
            rules: '카테고리/규칙',
            details: '카테고리/내역'
        },
        nav: {
            addRecord: '새 거래 추가',
            backToList: '목록으로 돌아가기',
            stats: '통계',
            calendar: '캘린더',
            settings: '설정',
            tabGeneral: '일반 기록',
            tabGeneralMobile: '일반<br>기록',
            tabFixed: '고정 기록',
            tabFixedMobile: '고정<br>기록',
            category: '카테고리'
        },
        list: {
            summary: '📊 현재 데이터: 수동 기록 {txLen}건, 고정 기록 {fixLen}건',
            filterAll: '전체',
            emptyFixed: '조건에 맞는 고정 기록이 없습니다.',
            emptyGeneral: '해당 월의 기록이 없습니다.',
            pageInfo: '제 {current} 페이지, 총 {total} 페이지',
            prevPage: '이전 페이지',
            nextPage: '다음 페이지',
            pageSizePre: '페이지당',
            pageSizePost: '건'
        },
        budget: {
            status: '이번 달 예산 {monthlyBudget} · 총 지출 ${totalExpenseMonth} ({budgetPercent}%)',
            over: '초과 {amount}',
            left: '잔액 {amount}'
        },
        record: {
            typeIncome: '수입',
            typeExpense: '지출',
            ruleYearly: '매년 {month}월 {day}일',
            ruleMonthly: '매월 {day}일',
            ruleWeekly: '매주 {weekday}',
            weekdays: ['일', '월', '화', '수', '목', '금', '토'],
            ruleCount: '총 {count}건',
            noDeadline: '기한 없음',
            labelTarget: '👤 대상:',
            labelLocation: '📍 장소:',
            labelNote: '📝 메모:',
            labelPhoto: '📷 사진 첨부됨',
            noNote: '메모 없음',
            fixedGeneratedTip: '고정 기록에 의해 생성된 내역입니다 (보기 전용)',
            addTitle: '기록 추가',
            copyTitle: '기록 복사',
            editFixedTitle: '고정 규칙 편집',
            viewFixedTitle: '고정 규칙 내역 보기',
            addBtn: '추가',
            copyBtn: '복사',
            promptLocation: '장소를 입력하거나 선택해 주세요',
            importantFestivalPrefix: '⭐',
            festivalJoin: ', ',
            attachment: '첨부파일'
        },
        batch: {
            typeNameFixed: '고정 규칙',
            typeNameGeneral: '일반 기록',
            unnamedRule: '이름 없는 규칙',
            boundPreview: '- [{name}] ({count}건의 기록, 예: {date})',
            andOthers: '... 및 기타',
            confirmDeleteFixed: '이 {count}건의 고정 규칙을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            confirmDeleteFixedBound: '【심각한 경고】 선택한 규칙에 의해 총 {totalBound}건의 기록 내역이 자동 생성되었습니다:\n{boundLines}\n\n규칙을 삭제하면 이 기록 내역도 "함께 삭제"됩니다!\n향후 기록 생성을 중단하려면 삭제를 취소하고 "종료일"을 변경하는 것을 권장합니다.\n\n정말 강제 삭제하고 기록 내역을 파기하시겠습니까?',
            confirmDeleteType: '이 {count}건의 {typeName}을(를) 삭제하시겠습니까?',
            btnDeleteSelected: '선택 항목 삭제 ({count})'
        },
        stats: {
            tabs: {
                pie: '원형 차트',
                bar: '막대 차트',
                line: '꺾은선 차트',
                annual: '연간 차트'
            },
            filters: {
                period: '기간:',
                week: '주',
                month: '월',
                year: '년',
                all: '전체',
                custom: '사용자 지정',
                groupby: '분류:',
                major: '대분류',
                sub: '소분류',
                payee: '대상',
                xaxis: 'X축:',
                byDay: '일별',
                byMonth: '월별',
                yearLabel: '연도:'
            },
            noData: '데이터 없음',
            unclassified: '(미분류)',
            unspecified: '(지정 안 됨)',
            tableMajor: '대분류',
            tableSub: '소분류',
            tableTarget: '대상',
            tableAmount: '금액',
            tablePercent: '비율',
            tableTotal: '합계',
            noAnnualRecord: '{year}년 기록이 없습니다',
            annualTotalIncome: '총 수입',
            annualTotalExpense: '총 지출',
            annualBalance: '잔액',
            monthlyDetails: '월별 상세',
            month: '월',
            monthSuffix: '월',
            year: '년',
            income: '수입',
            expense: '지출',
            top5Expenses: '지출 상위 5개 카테고리'
        },
        settings: {

            systemLogs: {
                title: '시스템 로그 (System Logs)',
                desc: '연결 또는 데이터 동기화 문제를 해결하는 데 도움이 되도록 최근 999개의 콘솔 로그를 표시합니다.',
                placeholderSearch: '시간 또는 키워드 검색...',
                titleCopy: '필터링된 로그 복사',
                btnCopy: '복사',
                btnExport: '내보내기',
                titleClear: '로그 지우기',
                btnClear: '지우기',
                confirmClear: '모든 시스템 로그를 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                emptyExport: '내보낼 로그가 없습니다',
                emptyCopy: '복사할 로그가 없습니다',
                copySuccess: '로그가 클립보드에 복사되었습니다',
                copyError: '복사 실패: {error}'
            },
            language: { title: '언어 (Language)' },
            title: '시스템 설정',
            sponsor: '작성자 후원',
            theme: {
                title: '디자인 테마'
            },
            backup: {
                title: '수동 및 자동 백업',
                manualExport: 'ZIP 내보내기',
                manualImport: '백업 가져오기',
                importHint: '.zip 또는 구버전 .json 형식 지원',
                autoExport: '자동 내보내기 범위',
                daily: '매일 (해당 월 데이터)',
                yearly: '연도별 (전체 연도 데이터)',
                yearlyAll: '모든 연도',
                yearlyCurrent: '올해만',
                yearlyLast: '작년 및 올해',
                includePhotos: '사진 포함 (파일 크기가 크게 증가함)',
                exporting: 'ZIP 백업 파일 다운로드 준비 중...',
                exportSuccess: '✅ 백업 내보내기 성공!\n총 {txCount}건의 일반 기록, {fixedCount}건의 고정 기록 내보냄\n대분류 {catCount}개 및 대상 설정 {tgtCount}개 포함',
                exportError: '내보내기 실패: {error}',
                importing: '백업 파일 분석 중...',
                importError: '복원 중 오류가 발생했습니다: {error}',
                errorJsonParse: 'JSON을 분석할 수 없습니다. 파일 형식이 잘못되었습니다.',
                errorOldFormat: '지원되지 않는 구버전 백업 형식입니다. 최신 버전의 백업 파일을 사용하세요.',
                errorUnsupportedFile: '지원되지 않는 파일 형식입니다. .zip 또는 .json 백업 파일을 제공해 주세요.',
                gasUrlConflictPrompt: '⚠️ 백업 파일 내의 "전용 백업 GAS URL"이 로컬과 다릅니다!\n\n[백업] {newUrl}\n[로컬] {oldUrl}\n\n백업의 URL로 로컬 URL을 "덮어쓰기" 하시겠습니까?\n\n("확인"을 눌러 덮어쓰기, "취소"를 눌러 로컬 URL 유지)',
                parsedTitle: '백업 파일 분석 완료',
                startImport: '가져오기 시작',
                cancel: '취소',
                clearingData: '로컬 데이터 지우는 중',
                deletingRecords: '기존 기록 삭제 중...',
                restoringLocal: '로컬로 복원 중',
                writingDb: '데이터베이스에 쓰는 중...',
                progressFormat: {
                    wait: '{type} 쓰기 대기 중... ({current} / {total})',
                    doing: '{type} 쓰는 중... ({current} / {total})',
                    done: '{type} 쓰기 완료... ({current} / {total})',
                    typeTx: '일반 기록',
                    typeFixed: '고정 기록',
                    typeCat: '카테고리 설정',
                    typeTgt: '대상 설정'
                },
                importComplete: '✅ 가져오기 완료!\n\n[이번에 추가됨]\n{adds}',
                reloading: '시스템이 새로 고침됩니다...',
                fullBackup: '전체 백업:',
                fullBackupDesc: '모든 기록, 고정 규칙, 카테고리 설정, 캘린더 설정.',
                overwriteWarning: '프라이빗 클라우드에서 복원할 때 현재 로컬 데이터를 완전히 덮어씁니다.',
                exportingTitle: '데이터 내보내는 중',
                advancedTitle: '고급 백업 설정 (로컬 및 클라우드에 적용)',
                mode: {
                    title: '백업 모드',
                    daily: '일상 백업 (전체 데이터, 덮어쓰기 복원에 적합)',
                    yearly: '연간 백업 (연도별 분할, 병합 복원에 적합)'
                },
                yearlyRange: {
                    title: '연간 백업 범위',
                    all: '연도별 백업 (모든 연도)',
                    current: '최근 1년만 백업 (올해)'
                },
                includePhotos: {
                    title: '사진 데이터 포함',
                    desc: '체크 해제하면 백업 파일 크기를 크게 줄일 수 있습니다'
                },
                restoreMode: {
                    title: '데이터 복원 모드 (로컬 및 클라우드에 적용)',
                    merge: '병합 모드 (로컬 유지, 중복 건너뛰기)',
                    overwrite: '덮어쓰기 모드 (로컬 지우기, 완전히 덮어쓰기)'
                },
                localTitle: '수동 파일 백업 (Local ZIP)',
                localDesc: '현재 기록을 ZIP 백업 파일로 내보내어 기기에 다운로드합니다. 기기 변경 또는 데이터 분실 시 이 파일을 통해 수동으로 복원할 수 있습니다.',
                exportBtn: '백업 내보내기',
                importBtn: '백업 가져오기',
                generateSample: '테스트 데이터 생성'
            },
            cloudBackup: {
                title: '프라이빗 클라우드 동기화 및 백업 (Google Apps Script)',
                syncing: '클라우드 동기화 처리 중...',
                desc: '모든 기록, 고정 규칙, 카테고리 설정, 캘린더 설정을 백업합니다.\n(*프라이빗 클라우드에서 복원할 때 현재 로컬 데이터를 완전히 덮어씁니다)',
                successSummary: '✅ 백업 내보내기 성공!\n총 {txCount}건의 일반 기록, {fixedCount}건의 고정 기록 내보냄\n대분류 {catCount}개 및 대상 설정 {tgtCount}개 포함',
                restoreConfirmMerge: '【병합 모드】\n이 데이터를 로컬에 병합하시겠습니까?\n(로컬 기록을 유지하고 중복된 항목은 자동으로 건너뜁니다)',
                restoreConfirmOverwrite: '【덮어쓰기 모드 경고】\n이 데이터를 사용하여 로컬의 모든 기록을 완전히 덮어쓰시겠습니까?\n(기존 로컬 기록은 모두 삭제됩니다!)',
                restoreConfirmEmpty: '【데이터 복원】\n이 클라우드 데이터를 로컬로 복원하시겠습니까?',
                restoreSummary: '이 백업에는 다음이 포함됩니다:\n- 일반 기록: {txCount}건\n- 고정 기록: {fixedCount}건\n- 카테고리 설정: {catCount}개\n- 대상 설정: {tgtCount}개\n',
                restoreFiltered: '\n(중복은 자동으로 필터링됨)\n',
                restoreFilteredTx: '- 일반 기록: {txSkip}건\n',
                restoreFilteredFixed: '- 고정 기록: {fixedSkip}건\n',
                restoreFilteredCat: '- 카테고리 설정: {catSkip}개\n',
                restoreFilteredTgt: '- 대상 설정: {tgtSkip}개\n',
                restoreCompleteEmpty: '✅ 클라우드 복원 완료!\n\n【추가됨】\n{adds}\n\n시스템이 새로 고침됩니다...',
                restoreCompleteOverwrite: '✅ 클라우드 복원 완료 (덮어쓰기 모드)!\n\n【추가됨】\n{adds}\n\n시스템이 새로 고침됩니다...',
                restoreCompleteMerge: '✅ 클라우드 복원 완료 (병합 모드)!\n\n【추가됨】\n{adds}',
                restoreCompleteMergeSkipped: '\n\n(중복 자동 건너뜀)\n',
                addedTx: '일반 기록 {tx}건',
                addedFixed: '고정 기록 {fixed}건',
                addedCat: '카테고리 설정 {cat}개',
                addedTgt: '대상 설정 {tgt}개'
            },
            accounts: {
                title: '계정 설정',
                add: '계정 추가',
                edit: '계정 편집',
                defaultAccountName: '계정 A',
                accountName: '계정 이름',
                accountNamePh: '예: 현금, 신용카드',
                requireName: '계정 이름을 입력해 주세요',
                tagColor: '태그 색상',
                monthlyBudget: '이번 달 예산',
                budgetPh: '예: 25000',
                save: '저장',
                budget: '이번 달 예산: ${amount}',
                isDefault: '기본값',
                setDefault: '기본으로 설정',
                deleteConfirmTitle: '이 계정을 삭제하시겠습니까?',
                deleteErrorMsg: '삭제할 수 없습니다! 이 계정에는 여전히 다음이 포함되어 있습니다:\n',
                deleteErrorTxs: '- {count}건의 단발성 거래 기록 ({dates}에 존재)\n',
                deleteErrorFixed: '- {count}건의 고정 수입/지출 규칙\n',
                deleteErrorEnd: '\n이 기록을 다른 계정으로 이동하거나 삭제한 후 다시 시도해 주세요.'
            },
            dataManagement: {
                title: '거래 정보 관리',
                expense: '지출 카테고리',
                income: '수입 카테고리',
                target: '기록 대상'
            },
            calendar: {
                title: '캘린더 및 표시 설정',
                remindDaysBefore: '며칠 전 알림:',
                monthSuffix: '월',
                daySuffix: '일',
                month: '{m} 월',
                day: '{d} 일',
                monthPh: '월',
                dayPh: '일',
                festivalNamePh: '기념일 이름을 입력하세요',
                dayNumPh: '일수 {n}',
                nationalHoliday: {
                    title: '법정 공휴일 (대만 전용)',
                    desc: '인사행정총처에서 발표한 공휴일을 표시합니다',
                    lastUpdated: '마지막 업데이트:',
                    neverUpdated: '없음',
                    updateNow: '지금 업데이트',
                    updating: '다운로드 중...',
                    updateSuccess: '✅ 공휴일 업데이트 완료!\n{years}년도 총 {count}건의 휴일 데이터를 다운로드했습니다.',
                    updateSuccessLog: '[시스템 설정] 공휴일 데이터 업데이트 성공 ({years}), 총 {count}건.',
                    updateError: '❌ 다운로드 실패: {error}'
                },
                lunarDate: {
                    title: '음력 날짜 (중국 전통)',
                    desc: '음력 날짜 표시 (예: 초하루, 보름)'
                },
                stembranch: {
                    title: '육십갑자 (중국 전통)',
                    desc: '일진 표시 (예: 갑자, 을축)'
                },
                solarterm: {
                    title: '24절기 (중국 전통)',
                    desc: '당일의 절기 이름 표시 (예: 입춘, 청명)'
                },
                festival: {
                    title: '명절/기념일 (중국 전통)',
                    desc: '전통 명절 및 기념일 표시'
                },
                globalFestival: {
                    title: '명절/기념일 (글로벌)',
                    desc: '세계적인 명절 및 서양 기념일 표시'
                },
                bazi: {
                    title: '사주팔자 (중국 전통)',
                    desc: '날짜 클릭 시 사주, 십신, 지장간 등 표시'
                },
                valentine: {
                    title: '재미있는 발렌타인데이',
                    desc: '매월 14일의 특색 있는 발렌타인데이 표시'
                },
                importantFestival: {
                    title: '주요 기념일 알림 설정',
                    enableTitle: '주요 기념일 알림 활성화',
                    enableDesc: '기념일이 오기 전에 기록 시 자동으로 팝업 알림이 표시되며, 캘린더에 별표가 표시됩니다.',
                    addBtn: '기념일 추가 (최대 10개)'
                }
            },
            photoUpload: {
                title: '사진 업로드',
                enableTitle: '사진 촬영/업로드 기능 활성화',
                enableDesc: '활성화 시 기록할 때 사진을 첨부할 수 있습니다.',
                maxSize: '최대 사진 크기',
                size320: '320 x 320',
                size480: '480 x 480 (권장 하한선)',
                size640: '640 x 640 (기본값)',
                size800: '800 x 800',
                size1024: '1024 x 1024',
                quality: 'JPEG 압축 품질',
                qual03: '0.3 (고압축)',
                qual05: '0.5 (권장 하한선)',
                qual07: '0.7 (기본값)',
                qual09: '0.9 (저압축)'
            },
            mapLink: {
                title: 'Google 지도 링크',
                enableTitle: '목록 장소를 지도에 링크',
                enableDesc: '홈 화면 기록 목록에서 장소를 클릭하여 지도를 직접 열 수 있도록 허용합니다.'
            },
            about: {
                title: '정보',
                licenseTitle: '오픈소스 및 라이선스',
                licenseDesc: '이 프로젝트에 사용된 타사 오픈소스 패키지 보기',
                openSourceLicense: '오픈소스 라이선스 (MIT License)',
                visualAssetsCopyright: '시각적 자산 저작권 선언',
                visualAssetsDesc: '이 프로젝트의 기본 소스 코드는 MIT 라이선스로 배포됩니다.<br><br>그러나 이 소프트웨어에 포함된 모든 브랜드 아이덴티티, UI 디자인, 아이콘 및 관련 시각적 자산에 대한 저작권은 원작자가 전적으로 보유하며 위의 MIT 라이선스는 <strong class="text-rose-600 dark:text-rose-400 font-semibold">적용되지 않습니다</strong>.<br><br>작성자의 명시적인 서면 승인 없이는 이러한 시각적 자산을 유용, 복제, 배포하거나 다른 프로젝트 또는 상업적 목적으로 사용하는 것이 엄격히 금지됩니다.',
                poweredBy: '기술 및 오픈소스 패키지'
            },

            categories: {
                title: '카테고리 관리',
                selectAll: '전체 선택',
                cascadeUpdateConfirm: '이 작업은 "{oldValue}"를 사용하는 모든 기존 기록을\n"{newValue}"로 한꺼번에 변경합니다. 계속하시겠습니까?',
                cascadeUpdateTitle: '연동 업데이트 확인',
                confirmUpdate: '변경 확인',
                cancel: '취소',
                noData: '데이터가 없습니다. 추가해 주세요.',
                addExpenseMajor: '지출 대분류 추가',
                addIncomeMajor: '수입 대분류 추가',
                promptNewMajor: '새 대분류 이름 입력:',
                deleteSelected: '🗑️ 선택 항목 삭제 ({count})',
                addMinor: '소분류 추가',
                promptNewMinor: '새 소분류 이름 입력:',
                deleteInUseMsg: '삭제할 수 없습니다! 이 카테고리는 다음에서 사용 중입니다:\n',
                deleteInUseTx: '- {count}건의 단발성 거래 기록 ({dates}{more}에 발생)\n',
                deleteInUseFixed: '- {count}건의 고정 규칙 ({names}{more})\n',
                deleteInUseTail: '\n이 기록을 삭제하거나 다른 카테고리로 변경한 후 다시 시도해 주세요.',
                editSub: '소분류 편집',
                deleteSub: '소분류 삭제',
                moreDays: ' 등 총 {count}일',
                etc: ' 등',
                deleteConfirm: '이 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                expenseTitle: '지출 카테고리 관리',
                incomeTitle: '수입 카테고리 관리',
                deleteBatchConfirm: '대분류 {majorCount}개, 소분류 {minorCount}개 등 총 {total}개 항목을 삭제하시겠습니까?\n(참고: 대분류를 삭제하면 하위의 모든 소분류도 함께 삭제됩니다)',
                deleteBatchConfirmMinorOnly: '선택한 소분류 항목 {count}개를 삭제하시겠습니까?',
                deleteBatchConfirmMajorOnly: '선택한 대분류 항목 {count}개를 삭제하시겠습니까?\n(참고: 대분류를 삭제하면 하위의 모든 소분류도 함께 삭제됩니다)',
                deleteBatchInUseMsg: '삭제할 수 없습니다! 다음 카테고리가 사용 중입니다:\n',
                deleteBatchInUseMinorItem: '- 소분류 [{major} > {sub}] ({details})',
                deleteBatchInUseMajorItem: '- 대분류 [{major}] ({details})',
                deleteBatchInUseTxDetail: '{count}건의 기록(예 {date})',
                deleteBatchInUseFixedDetail: '{count}건의 규칙',
                deleteBatchInUseMore: '\n...및 기타 항목',
                deleteBatchInUseTail: '\n\n먼저 이러한 기록을 삭제하거나 다른 카테고리로 변경한 후 다시 시도해 주세요.'
            },
            targets: {
                title: '기록 대상',
                addTarget: '대상 추가',
                selectAll: '전체 선택',
                noData: '데이터가 없습니다. 추가해 주세요.',
                noDataSimple: '데이터 없음',
                deleteSelected: '🗑️ 선택 항목 삭제 ({count})',
                deleteInUseMsg: '삭제할 수 없습니다! 이 대상은 다음에서 사용 중입니다:\n',
                deleteInUseTx: '- {count}건의 단발성 거래 기록 ({dates}{more}에 발생)\n',
                deleteInUseFixed: '- {count}건의 고정 규칙 ({names}{more})\n',
                deleteInUseTail: '\n이 기록을 삭제하거나 다른 대상으로 변경한 후 다시 시도해 주세요.',
                moreDates: ' 등 총 {count}일',
                deleteConfirm: '이 대상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                promptNewTarget: '새 대상 이름 입력:',
                duplicateAlert: '대상 이름 "{name}"이(가) 이미 존재합니다!',
                reorderTitle: '정렬 번호를 선택하세요 (작은 숫자일수록 우선순위 높음)',
                deleteBatchInUseMsg: '삭제할 수 없습니다! 다음 대상이 사용 중입니다:\n',
                deleteBatchInUseItem: '- 대상 [{name}] ({details})',
                deleteBatchInUseMore: '\n...및 기타 항목',
                deleteBatchInUseTail: '\n\n먼저 이러한 기록을 삭제하거나 다른 대상으로 변경한 후 다시 시도해 주세요.',
                deleteBatchConfirm: '선택한 {count}개의 대상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                cascadeUpdateTitle: '연동 업데이트 확인',
                cascadeUpdateConfirm: '과거 기록의 대상 "{oldValue}"도(과) 함께 "{newValue}"(으)로 업데이트하시겠습니까?',
                confirmUpdate: '연동 업데이트'
            },
            accountA: '계정 A',
            defaultBadge: '기본값',
            monthlyBudget: '이번 달 예산: ${amount}',
            setDefault: '기본으로 설정',
            deleteAccountError: '삭제할 수 없습니다! 이 계정에는 다음이 포함되어 있습니다:\n{boundTxs}{boundFixed}\n이 기록들을 먼저 다른 계정으로 이동하거나 삭제한 후 다시 시도해 주세요.',
            deleteAccountErrorTx: '- {count}건의 단발성 거래 기록 ({displayDates}{moreStr}에 존재)\n',
            deleteAccountErrorMoreDates: ' 등 총 {count}개 날짜',
            deleteAccountErrorFixed: '- {count}건의 고정 규칙\n',
            confirmDeleteAccount: '이 계정을 삭제하시겠습니까?',
            editAccountError: '계정을 편집하는 중 오류 발생: {error}',
            addAccountError: '계정을 추가하는 중 오류 발생: {error}',
            modalAddAccount: '계정 추가',
            modalEditAccount: '계정 편집',
            modalAccountName: '계정 이름',
            modalLabelColor: '태그 색상',
            modalSave: '저장',
            festivalMonth: '월',
            festivalDay: '일',
            festivalName: '기념일 이름 (예: 결혼기념일)',
            festivalReminder: '알림(일 전):',
            festivalDays1: '일수 1',
            festivalDays2: '일수 2',
            festivalDays3: '일수 3',
            downloading: '다운로드 중...',
            lastUpdated: '마지막 업데이트: {date}',
            lastUpdatedNever: '마지막 업데이트: 없음',
            holidayUpdateSuccess: '✅ 휴일 데이터 업데이트 완료!\n{years}년도 총 {count}건의 데이터를 다운로드했습니다.',
            holidayUpdateFail: '❌ 다운로드 실패: {error}',
            holidayUpdateFailUnknown: '알 수 없는 오류',
            btnUpdateHoliday: '공휴일 업데이트',
            backupSuccess: '✅ 백업 내보내기 성공!\n총 {txCount}건의 일반 기록, {fixedCount}건의 고정 규칙 내보냄\n대분류 {catCount}개 및 대상 설정 {tgtCount}개 포함',
            restoreConfirmWarningLocalEmpty: '【데이터 복원】\n이 클라우드 데이터를 로컬로 복원하시겠습니까?',
            restoreConfirmWarningOverwrite: '【덮어쓰기 모드 경고】\n이 데이터를 사용하여 로컬의 모든 기록을 완전히 덮어쓰시겠습니까?\n(로컬의 기존 기록은 모두 삭제됩니다!)',
            restoreConfirmWarningMerge: '【병합 모드】\n이 데이터를 로컬에 병합하시겠습니까?\n(로컬 기록을 유지하고 중복된 항목은 자동으로 건너뜁니다)',
            restoreConfirmMsg: '이 백업에는 다음이 포함됩니다:\n- 일반 기록: {totalTx}건\n- 고정 규칙: {totalFixed}건\n- 카테고리 설정: {totalCat}개\n- 대상 설정: {totalTgt}개\n',
            restoreConfirmMsgFilter: '\n(중복은 자동 필터링됨)\n',
            restoreConfirmMsgFilterTx: '- 일반 기록: {count}건\n',
            restoreConfirmMsgFilterFixed: '- 고정 규칙: {count}건\n',
            restoreConfirmMsgFilterCat: '- 카테고리 설정: {count}개\n',
            restoreConfirmMsgFilterTgt: '- 대상 설정: {count}개\n',
            inputNamePlaceholder: '예: 현금, 신용카드',
            inputBudgetPlaceholder: '예: 25000',
            requireAccountName: '계정 이름을 입력해 주세요'
        },
        modals: {
            accountFilter: {
                title: '계정 필터링',
                selectLabel: '표시할 계정 선택',
                selectAll: '전체 선택',
                clearAll: '선택 해제',
                confirm: '확인'
            },
            crop: {
                title: '사진 자르기',
                warning: '⚠️ 반복적으로 자르면 화질이 저하될 수 있습니다',
                cancel: '취소',
                confirm: '자르기 확인'
            },
            photoHelp: {
                title: '사진 품질 권장 설정',
                p1: '320x320 및 0.3 품질은 "매우 흐리게" 보입니다. "이것은 커피다"라는 추상적인 이미지만 촬영하고 싶다면 억지로 쓸 수 있지만, "실제 영수증"을 촬영한다면 글자와 숫자가 모두 뭉개져 알아볼 수 없게 됩니다.',
                p2: '영수증의 숫자를 인식할 수 있게 유지하려면 최소한 <strong style="color: var(--primary-color);">480x480 / 품질 0.5</strong> 이상으로 설정할 것을 권장합니다.',
                estimateTitle: '단일 사진 예상 크기 (데이터베이스 저장 후)',
                li1: '320x320 / 품질 0.3: 약 10~20 KB <span style="font-size: 0.8rem;">(매우 작지만 매우 흐릿함)</span>',
                li2: '480x480 / 품질 0.5: 약 15~30 KB',
                li3: '640x640 / 품질 0.7: 약 40~60 KB <strong style="color: var(--text-main); font-weight: 500;">(기본값, 화질 좋음)</strong>',
                li4: '1024x1024 / 품질 0.9: 약 150~250 KB <span style="font-size: 0.8rem;">(매우 선명하지만 용량이 큼)</span>',
                understand: '이해했습니다'
            },
            record: {
                editTitle: '기록 편집',
                tabExpense: '지출',
                tabIncome: '수입',
                tabSingle: '일반',
                tabFixed: '고정',
                date: '날짜',
                dateRange: '시작 및 종료일',
                startDate: '시작일',
                endDate: '종료일',
                amount: '금액',
                repeatType: '반복 방식',
                ruleYearly: '매년',
                ruleMonthly: '매월',
                ruleWeekly: '매주',
                ruleDetail: '상세 규칙',
                monday: '월요일',
                tuesday: '화요일',
                wednesday: '수요일',
                thursday: '목요일',
                friday: '금요일',
                saturday: '토요일',
                sunday: '일요일',
                majorCat: '대분류',
                subCat: '소분류',
                target: '대상',
                location: '장소',
                locationPlaceholder: '주소 또는 상호명 입력',
                mapTitle: '지도에서 열기',
                photo: '사진',
                photoUpload: '사진 촬영 또는 업로드',
                photoPreview: '미리보기',
                photoRecrop: '다시 자르려면 클릭',
                photoDelete: '사진 삭제',
                note: '메모',
                notePlaceholder: '메모 입력...',
                btnDelete: '삭제',
                btnCopy: '복사',
                btnSave: '저장',
                btnCancel: '취소'
            }
        },
        globalFestivals: {
            newYear: '새해 첫날',
            valentinesDay: '발렌타인데이',
            womensDay: '국제 여성의 날',
            foolsDay: '만우절',
            earthDay: '지구의 날',
            laborDay: '노동절',
            halloween: '할로윈',
            christmas: '크리스마스',
            mothersDay: '어머니의 날',
            thanksgiving: '추수감사절',
            easter: '부활절',
            internationalCoopDay: '국제 협동조합의 날',
            captiveNationsWeek: '피노예 국가 주간',
            diaryValentinesDay: '다이어리 데이',
            westernValentinesDay: '서양 발렌타인데이',
            whiteValentinesDay: '화이트 데이',
            blackValentinesDay: '블랙 데이',
            roseValentinesDay: '로즈 데이',
            kissValentinesDay: '키스 데이',
            silverValentinesDay: '실버 데이',
            greenValentinesDay: '그린 데이',
            photoValentinesDay: '뮤직 포토 데이',
            wineValentinesDay: '와인 데이',
            movieValentinesDay: '무비 데이',
            hugValentinesDay: '허그 데이'
        },
        calendar: {
            weekdays: ['일', '월', '화', '수', '목', '금', '토'],
            months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            lunarDays: ['초하루','초이틀','초사흘','초나흘','초닷새','초엿새','초이레','초여덟','초아홉','초열흘','열하루','열두째','열세째','열네째','보름','열여섯','열일곱','열여덟','열아홉','스무날','스물하나','스물둘','스물셋','스물넷','스물다섯','스물여섯','스물일곱','스물여덟','스물아홉','그믐'],
            lunarMonths: ['정','2','3','4','5','6','7','8','9','10','11','12'],
            lunarLeap: '윤',
            lunarMonthSuffix: '월',
            dayDetail: {
                txTitle: '오늘의 거래 기록',
                closeBtn: '상세 정보 닫기'
            },
            recordOf: '의 기록',
            noRecord: '오늘 기록이 없습니다',
            baziDayMaster: '일간',
            baziYearPillar: '년주',
            baziMonthPillar: '월주',
            baziDayPillar: '일주',
            baziNote: '* 간이 사주에는 시주가 포함되지 않습니다.'
        }
    },
    systemLogs: {
        taiwanHolidays: {
            localStorageFormatError: '[캘린더] localStorage 데이터 형식 오류({func}), 무시됨',
            loadPersistedError: '[캘린더] 로컬 공휴일 데이터 로드 실패({func}):',
            noDataYet: '[캘린더] {year}년도 공휴일 데이터가 아직 제공되지 않았습니다.',
            fetchError: '[API] 정부 캘린더 가져오기 실패({func} - {year}):',
            downloadError: '[API] 정부 캘린더 다운로드 실패({year}):',
            saveLocalStorageError: '[캘린더] localStorage 저장 실패:',
            updateUnexpectedError: '[API] 공휴일 데이터를 수동으로 업데이트하는 중 예기치 않은 오류 발생:'
        },
        themeSwitcher: {
            readCustomThemeError: '[디자인 테마] 사용자 지정 테마를 읽을 수 없음:',
            containerNotFound: '[디자인 테마] 테마 컨테이너를 찾을 수 없음: {containerId}',
            switchedTheme: '[디자인 테마] 메뉴를 통해 테마를 다음으로 전환함: {newTheme}'
        }
    }
};

