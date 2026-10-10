// 🔄 MIGRATION: ปรับสถานะคำสั่งซื้อทั้งหมดใน Firestore เป็นชุดมาตรฐาน (run ครั้งเดียว, idempotent)
// มาตรฐาน: รอชำระเงิน | รอตรวจสอบ | รอดำเนินการ | รอประเมินราคา | ชำระเงินแล้ว | ยกเลิก
// + fulfillment: packing/shipped/delivered (แยกการจัดส่งออกจากสถานะ)
// + branch (แยกสาขาออกจากสถานะ "รอชำระที่สาขา (X)")
// + cancelledBy: 'customer' (แยก "ยกเลิกโดยลูกค้า" ออกจากสถานะ)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

const CANONICAL = ['รอชำระเงิน', 'รอตรวจสอบ', 'รอดำเนินการ', 'รอประเมินราคา', 'ชำระเงินแล้ว', 'ยกเลิก'];

const buildUpdate = (o) => {
    const st = String(o.status ?? '').trim();
    if (!st || CANONICAL.includes(st)) return null;
    const upd = {};
    const branchMatch = st.match(/^รอชำระที่สาขา\s*\((.+)\)$/);

    if (branchMatch) {
        upd.status = 'รอชำระเงิน';
        if (!o.branch) upd.branch = branchMatch[1].trim();
    }
    else if (['รอตรวจสอบยอดโอน', 'รอตรวจสอบยอดโอน (เติมเครดิต)', 'รอตรวจสอบยอดโอน (รับคอร์สแล้ว)'].includes(st)) upd.status = 'รอตรวจสอบ';
    else if (['รอดำเนินการ (ตัดเครดิต)', 'รออนุมัติ'].includes(st)) upd.status = 'รอดำเนินการ';
    else if (st === 'รอประเมินราคา (เบิกเครดิต)') upd.status = 'รอประเมินราคา';
    else if (['อนุมัติแล้ว', 'สำเร็จ (ชำระแล้ว)', 'ชำระแล้ว', 'approved'].includes(st)) upd.status = 'ชำระเงินแล้ว';
    else if (st === 'จัดส่งแล้ว') { upd.status = 'ชำระเงินแล้ว'; if (!o.fulfillment) upd.fulfillment = 'shipped'; }
    else if (st === 'สำเร็จ (รับของแล้ว)') { upd.status = 'ชำระเงินแล้ว'; if (!o.fulfillment) upd.fulfillment = 'delivered'; }
    else if (st === 'ยกเลิกโดยลูกค้า') { upd.status = 'ยกเลิก'; if (!o.cancelledBy) upd.cancelledBy = 'customer'; }
    else if (st.toLowerCase() === 'pending') upd.status = 'รอดำเนินการ';
    else if (st.toLowerCase() === 'cancelled' || st.toLowerCase() === 'canceled') upd.status = 'ยกเลิก';
    else return { skipped: st }; // สถานะอื่นที่ไม่รู้จัก → เก็บไว้ ไม่แตะ

    return upd;
};

const run = async () => {
    const snap = await getDocs(collection(db, 'orders'));
    let changed = 0, skipped = 0, alreadyOk = 0;
    const unknown = new Set();
    const changes = [];

    for (const d of snap.docs) {
        const data = d.data();
        const upd = buildUpdate(data);
        if (upd == null) { alreadyOk++; continue; }
        if (upd.skipped) { skipped++; unknown.add(upd.skipped); continue; }
        await updateDoc(doc(db, 'orders', d.id), upd);
        changed++;
        if (changes.length < 30) changes.push(`${d.id}: "${data.status}" → "${upd.status}"${upd.branch ? ` (+branch=${upd.branch})` : ''}${upd.fulfillment ? ` (+fulfillment=${upd.fulfillment})` : ''}${upd.cancelledBy ? ' (+cancelledBy=customer)' : ''}`);
    }

    console.log(`รวม ${snap.size} รายการ | แปลงแล้ว ${changed} | เป็นมาตรฐานอยู่แล้ว ${alreadyOk} | ข้าม(ไม่รู้จัก) ${skipped}`);
    if (unknown.size) console.log('สถานะที่ไม่รู้จัก (ไม่ได้แตะ):', [...unknown].join(' | '));
    console.log('ตัวอย่างที่แปลง:'); changes.forEach(c => console.log('  ' + c));
    process.exit(0);
};

run().catch(e => { console.error('MIGRATION FAILED:', e); process.exit(1); });
