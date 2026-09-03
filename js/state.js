import { initDB, db } from './db.js';

export const state = {
    categories: {
        income: [],
        expense: []
    },
    targets: [],
    transactions: [],
    fixedRecords: []
};

// 預設資料
const defaultExpenseCategories = [
    { type: 'expense', major: '餐　飲', sub: ['早餐', '午餐', '晚餐', '宵夜', '飲料', '泡麵', '餅乾', '麵包'], order: 1 },
    { type: 'expense', major: '家庭開銷', sub: ['零用錢', '水費', '電費', '電話費', '網路費', '傢俱', '家電', '清潔品', '房貸', '購物廣場'], order: 2 },
    { type: 'expense', major: '醫療保健', sub: ['保險費', '醫藥費', '保健食品'], order: 3 },
    { type: 'expense', major: '服　飾', sub: ['外套', '衣服', '褲子', '裙子', '鞋子', '帽子', '圍巾', '手套', '內衣', '內褲', '襪子', '隱形眼鏡'], order: 4 },
    { type: 'expense', major: '３Ｃ設備', sub: ['電腦', '手機', '平板', '遊戲機', '手機配件'], order: 5 },
    { type: 'expense', major: '交通門票', sub: ['火車票', '高鐵票', '捷運票', '計程車', '住宿費', '門票', '停車費', '加油費', '車輛保養'], order: 6 },
    { type: 'expense', major: '娛　樂', sub: ['看電影', '打彈珠', '打氣球', '娃娃機', '唱歌', '抽卡', '遊戲課金'], order: 7 },
    { type: 'expense', major: '進修交際', sub: ['書籍', '課程', '考試', '聚餐', '送禮', '紅包'], order: 8 },
    { type: 'expense', major: '稅　金', sub: ['健保費', '勞保費', '國民年金', '營業稅', '牌照稅', '綜合所得稅', '房屋稅', '燃料稅', '地價稅'], order: 9 },
    { type: 'expense', major: '其　他', sub: ['雜支', '遺失', '未分類'], order: 10 }
];

const defaultIncomeCategories = [
    { type: 'income', major: '薪　資', sub: ['本薪', '績效', '節日', '加班', '兼職'], order: 1 },
    { type: 'income', major: '投　資', sub: ['股票', '股息', '存款利息', '基金回報', '外匯/加密貨幣'], order: 2 },
    { type: 'income', major: '其　他', sub: ['禮金', '退款', '發票中獎', '補助金'], order: 3 }
];

const defaultTargets = [
    { name: '自　己', order: 1 },
    { name: '老　公', order: 2 },
    { name: '老　婆', order: 3 },
    { name: '小　孩', order: 4 },
    { name: '爺　爺', order: 5 },
    { name: '奶　奶', order: 6 },
    { name: '全　家', order: 7 },
    { name: '其　他', order: 8 }
];

let isInitializing = false;

export const initState = async () => {
    if (isInitializing) return;
    isInitializing = true;

    try {
        await initDB();
        await loadCategories();
        await loadTargets();
        await loadTransactions();
    } finally {
        isInitializing = false;
    }
};

const loadCategories = async () => {
    let cats = await db.getCategories();
    if (cats.length === 0) {
        // Seed default categories
        for (const cat of [...defaultExpenseCategories, ...defaultIncomeCategories]) {
            await db.saveCategory(cat);
        }
        cats = await db.getCategories();
    }
    state.categories.expense = cats.filter(c => c.type === 'expense').sort((a, b) => a.order - b.order);
    state.categories.income = cats.filter(c => c.type === 'income').sort((a, b) => a.order - b.order);
};

const loadTargets = async () => {
    let tgts = await db.getTargets();
    if (tgts.length === 0) {
        // Seed default targets
        for (const tgt of defaultTargets) {
            await db.saveTarget(tgt);
        }
        tgts = await db.getTargets();
    }
    state.targets = tgts.sort((a, b) => a.order - b.order);
};

const loadTransactions = async () => {
    state.transactions = await db.getTransactions();
    state.fixedRecords = await db.getFixedRecords();
};
