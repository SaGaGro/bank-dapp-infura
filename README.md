# Bank DApp ผ่าน Infura

เว็บภาษาไทยสำหรับฝาก ถอน และตรวจยอดในสัญญา `Bank` บน Ethereum Hoodi ฟังก์ชันตรวจยอดใช้ชื่อ `checkBlance()` ตามสัญญาในโจทย์ และอ่านยอดตามที่อยู่ของกระเป๋าที่เชื่อมต่อ

Infura ให้บริการ RPC สำหรับอ่านข้อมูลและส่งธุรกรรมที่ลงนามแล้ว เว็บใช้ ethers ลงนามในเบราว์เซอร์ด้วย private key ของกระเป๋าทดสอบ และเก็บคีย์ในหน่วยความจำระหว่างการเชื่อมต่อ คีย์ที่ใช้ลงนามจะไม่ถูกส่งไปยัง Infura ใช้เฉพาะกระเป๋า Hoodi ที่สร้างสำหรับงานนี้

## รันบนเครื่อง

ใช้ Node.js 22.12 ขึ้นไป

```powershell
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง กรอก Infura API Key ที่เปิดใช้ Ethereum Hoodi ที่อยู่สัญญา และ private key ของกระเป๋าทดสอบ กระเป๋าต้องมี Hoodi ETH สำหรับยอดฝากและค่า gas ของธุรกรรมฝากถอน

## เตรียมสัญญาและข้อมูลนักศึกษา

ถ้ามีสัญญา Bank ตามโจทย์บน Hoodi แล้ว ให้ใช้ที่อยู่เดิมได้ หากต้อง deploy ใหม่ ให้สร้างไฟล์ `.env` จาก `.env.example` แล้วตั้งค่า `INFURA_API_KEY` และ `DEPLOYER_PRIVATE_KEY` ของกระเป๋าทดสอบที่มี Hoodi ETH

```powershell
Copy-Item .env.example .env
# กรอกค่าทั้งสองใน .env ก่อนรันคำสั่งถัดไป
npm run deploy:contract
```

กรอก `studentId`, `studentName` และ `contractAddress` ใน `config.js` เพื่อให้เว็บแสดงชื่อและรหัสจริง พร้อมเติมที่อยู่สัญญาให้อัตโนมัติ เก็บ API Key และ private key ไว้ใน `.env` สำหรับ deploy หรือกรอกในหน้าเว็บตอนทดสอบเท่านั้น

## เผยแพร่บน GitHub Pages

1. นำโปรเจกต์ขึ้น GitHub ใน branch `main`
2. ไปที่ **Settings → Pages → Build and deployment** แล้วเลือก **GitHub Actions**
3. รัน workflow **Publish Bank DApp to GitHub Pages** จากแท็บ Actions หรือ push ไปยัง `main` หลังเปิด Pages
4. เปิด URL จากผล deploy แล้วทดสอบเชื่อมต่อ ฝาก ตรวจยอด และถอน จากนั้นใช้ URL ดังกล่าวส่งงานใน dlearning
