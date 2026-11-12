import { Contract, JsonRpcProvider, Wallet, formatEther, getAddress, parseEther } from "ethers";
import { bankAbi, chainId, infuraUrl } from "./bank.js";
import { config } from "./config.js";
import "./style.css";

const byId = (id) => document.getElementById(id);
const connectForm = byId("connect");
const connected = byId("connected");
const actions = byId("bank-actions");
const balance = byId("balance");
const status = byId("status");
const explorer = byId("explorer");
const privateKey = byId("private-key");
const apiKey = byId("api-key");
const addressInput = byId("contract");
const amountInput = byId("amount");
let session;

byId("student-id").textContent = config.studentId || "รอระบุ";
byId("student-name").textContent = config.studentName || "รอระบุ";
addressInput.value = config.contractAddress;

function reportError(error) {
  const messages = {
    INVALID_ARGUMENT: "ที่อยู่สัญญาหรือ private key ไม่ถูกต้อง",
    INSUFFICIENT_FUNDS: "Hoodi ETH ในกระเป๋าไม่เพียงพอสำหรับยอดฝากหรือค่าธรรมเนียม",
    CALL_EXCEPTION: "สัญญาปฏิเสธรายการ โปรดตรวจที่อยู่สัญญาและยอดฝาก",
    NETWORK_ERROR: "เชื่อมต่อเครือข่ายไม่ได้ โปรดตรวจ Infura API Key และลองอีกครั้ง",
    SERVER_ERROR: "Infura ไม่สามารถดำเนินการได้ โปรดตรวจ API Key หรือสิทธิ์ของโปรเจกต์",
    TIMEOUT: "ยังไม่ได้รับการยืนยัน โปรดตรวจสถานะจากลิงก์ธุรกรรมก่อนส่งรายการใหม่",
  };
  // ethers errors can include the RPC URL or input key.
  status.textContent = error.code
    ? (messages[error.code] ?? "ดำเนินการไม่สำเร็จ โปรดตรวจการเชื่อมต่อและสถานะธุรกรรม")
    : error.message;
}

async function refreshBalance() {
  balance.value = formatEther(await session.bank.checkBlance());
}

connectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  status.textContent = "กำลังเชื่อมต่อ Infura…";
  let provider;
  try {
    const address = getAddress(addressInput.value.trim());
    provider = new JsonRpcProvider(infuraUrl(apiKey.value.trim()), undefined, { batchMaxCount: 1 });
    const key = privateKey.value.trim();
    privateKey.value = "";
    const wallet = new Wallet(key.startsWith("0x") ? key : `0x${key}`, provider);
    if ((await provider.getNetwork()).chainId !== chainId) throw new Error("กรุณาใช้เครือข่าย Hoodi");
    if (await provider.getCode(address) === "0x") throw new Error("ไม่พบสัญญาที่ที่อยู่นี้บน Hoodi");
    const bank = new Contract(address, bankAbi, wallet);
    balance.value = formatEther(await bank.checkBlance());
    session = { provider, bank };
    byId("wallet-address").textContent = wallet.address;
    byId("contract-address").textContent = address;
    apiKey.value = "";
    connectForm.hidden = true;
    connected.hidden = false;
    actions.disabled = false;
    status.textContent = "เชื่อมต่อแล้ว";
  } catch (error) {
    provider?.destroy();
    reportError(error);
  } finally {
    button.disabled = false;
  }
});

byId("disconnect").addEventListener("click", () => {
  session.provider.destroy();
  session = undefined;
  connectForm.hidden = false;
  connected.hidden = true;
  actions.disabled = true;
  amountInput.value = "";
  balance.value = "—";
  explorer.hidden = true;
  status.textContent = "ตัดการเชื่อมต่อแล้ว";
});

async function runBankAction(action) {
  actions.disabled = true;
  const disconnect = byId("disconnect");
  disconnect.disabled = true;
  try {
    await action();
  } catch (error) {
    reportError(error);
  } finally {
    actions.disabled = false;
    disconnect.disabled = false;
  }
}

byId("refresh").addEventListener("click", () => runBankAction(async () => {
  status.textContent = "กำลังตรวจยอดฝาก…";
  await refreshBalance();
  status.textContent = "อัปเดตยอดฝากแล้ว";
}));

byId("transaction").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!session || actions.disabled) return;
  const deposit = event.submitter?.value !== "withdraw";
  runBankAction(async () => {
    const input = amountInput.value.trim();
    if (!/^\d+(?:\.\d{1,18})?$/.test(input) || parseEther(input) === 0n) {
      throw new Error("กรุณากรอกจำนวน ETH ที่มากกว่า 0 และมีทศนิยมไม่เกิน 18 หลัก");
    }
    const amount = parseEther(input);
    if (!deposit && amount > await session.bank.checkBlance()) {
      throw new Error("ยอดถอนสูงกว่ายอดฝากในสัญญา");
    }
    status.textContent = "กำลังลงนามและส่งธุรกรรมผ่าน Infura…";
    const tx = deposit ? await session.bank.deposit({ value: amount }) : await session.bank.withdraw(amount);
    explorer.href = `https://hoodi.etherscan.io/tx/${tx.hash}`;
    explorer.hidden = false;
    status.textContent = "ส่งธุรกรรมแล้ว กำลังรอการยืนยัน…";
    await tx.wait(1, 120_000);
    amountInput.value = "";
    const success = deposit ? "ฝากสำเร็จ" : "ถอนสำเร็จ";
    status.textContent = success;
    try {
      await refreshBalance();
    } catch {
      status.textContent = `${success} กรุณากดตรวจยอดฝากเพื่ออัปเดตยอด`;
    }
  });
});
