export const generateFixedTransactions = (fixedRecord) => {
    const txs = [];
    const start = new Date(fixedRecord.startDate);
    const end = new Date(fixedRecord.endDate);
    
    // Safety check
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return txs;
    }

    const { rule, ruleDetail } = fixedRecord;

    const addTx = (dateObj) => {
        // Strip time part for exact comparison, or just format it
        const dateStr = dateObj.getFullYear() + '-' + 
            String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
            String(dateObj.getDate()).padStart(2, '0');
            
        // ensure it falls within bounds
        const dStrStart = fixedRecord.startDate;
        const dStrEnd = fixedRecord.endDate;

        if (dateStr >= dStrStart && dateStr <= dStrEnd) {
            txs.push({
                date: dateStr,
                type: fixedRecord.type,
                majorCategory: fixedRecord.majorCategory,
                subCategory: fixedRecord.subCategory,
                amount: fixedRecord.amount,
                payee: fixedRecord.payee,
                location: fixedRecord.location,
                note: fixedRecord.note,
                attachment: fixedRecord.attachment,
                isFixed: true,
                fixedId: fixedRecord.id
            });
        }
    };

    if (rule === 'yearly') {
        const { month, day } = ruleDetail;
        const endYear = end.getFullYear();
        for (let y = start.getFullYear(); y <= endYear; y++) {
            // Check for valid day (e.g. Feb 29)
            let d = new Date(y, month - 1, day);
            if (d.getMonth() !== month - 1) {
                d = new Date(y, month, 0); // clamp to last day of month
            }
            addTx(d);
        }
    } else if (rule === 'monthly') {
        const { day } = ruleDetail;
        const startM = start.getFullYear() * 12 + start.getMonth();
        const endM = end.getFullYear() * 12 + end.getMonth();
        
        for (let i = startM; i <= endM; i++) {
            const year = Math.floor(i / 12);
            const month = i % 12;
            let d = new Date(year, month, day);
            if (d.getMonth() !== month) {
                d = new Date(year, month + 1, 0);
            }
            addTx(d);
        }
    } else if (rule === 'weekly') {
        const { weekday } = ruleDetail;
        let iterDate = new Date(start.getTime());
        // find first matching day
        while (iterDate.getDay() !== weekday) {
            iterDate.setDate(iterDate.getDate() + 1);
        }
        while (iterDate <= end) {
            addTx(new Date(iterDate));
            iterDate.setDate(iterDate.getDate() + 7);
        }
    }

    return txs;
};

/**
 * 取得一般交易的 Fingerprint (特徵碼)，用於判斷是否重複
 */
export const getTxFingerprint = (tx) => {
    return `${tx.date}_${tx.type}_${tx.majorCategory}_${tx.subCategory}_${tx.amount}_${tx.payee || ''}_${tx.location || ''}_${tx.note || ''}`;
};

/**
 * 取得固定紀錄的 Fingerprint (特徵碼)，用於判斷是否重複
 */
export const getFixedFingerprint = (f) => {
    const ruleStr = typeof f.ruleDetail === 'object' ? JSON.stringify(f.ruleDetail) : f.ruleDetail;
    return `${f.startDate}_${f.endDate}_${f.rule}_${ruleStr}_${f.type}_${f.majorCategory}_${f.subCategory}_${f.amount}_${f.payee || ''}_${f.location || ''}_${f.note || ''}`;
};
