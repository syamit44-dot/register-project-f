import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

export default function ExampleForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success

  function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    // ตัวอย่าง mock — ยังไม่ยิง backend จริง
    setTimeout(() => {
      setStatus("success");
    }, 700);
  }

  if (status === "success") {
    return (
      <div>
        <Topbar tag="FORM" />
        <div className="mx-auto max-w-[560px] px-6 py-16 text-center">
          <h2 className="mb-2 font-['Space_Grotesk'] text-xl font-semibold">บันทึกสำเร็จ (ตัวอย่าง)</h2>
          <p className="mb-6 text-sm text-ink-soft">
            ข้อมูลนี้เป็นแค่ตัวอย่าง mock ยังไม่ได้ส่งไป backend จริง
          </p>
          <button
            type="button"
            className="rounded-sm bg-brand-dark px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            onClick={() => navigate("/home")}
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar tag="FORM" />
      <form className="mx-auto max-w-[560px] px-6 py-10" onSubmit={handleSubmit}>
        <h2 className="mb-6 font-['Space_Grotesk'] text-xl font-semibold">เพิ่มข้อมูลใหม่ (ตัวอย่าง)</h2>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-ink-soft">ชื่อรายการ</label>
          <input
            className="w-full rounded border border-line-strong p-2 text-sm focus:border-brand focus:ring focus:ring-brand-tint"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-ink-soft">หมายเหตุ</label>
          <textarea
            className="w-full rounded border border-line-strong p-2 text-sm focus:border-brand focus:ring focus:ring-brand-tint"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded bg-brand-dark py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {status === "loading" ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
