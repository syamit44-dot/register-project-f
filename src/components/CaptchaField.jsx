import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useTurnstile } from "../hooks/useTurnstile";

// ครอบ useTurnstile ไว้ในคอมโพเนนต์แยกต่างหาก เพื่อให้ <div id={containerId}>
// mount ขึ้นมาพร้อมกับตอนที่ effect ข้างใน hook ไปหา container ด้วย id
// (สำคัญเวลาใช้ในโมดัลที่เปิด/ปิดแบบ conditional render — ถ้า div อยู่นอกคอมโพเนนต์นี้
// แล้ว hook ทำงานตอน mount ครั้งแรกก่อน div จะโผล่ กล่อง Turnstile จะไม่ขึ้น)
const CaptchaField = forwardRef(function CaptchaField({ onVerifiedChange }, ref) {
  const { getToken, containerId, reset, isVerified } = useTurnstile();

  useEffect(() => {
    onVerifiedChange?.(isVerified);
  }, [isVerified, onVerifiedChange]);

  useImperativeHandle(ref, () => ({ getToken, reset, isVerified }));

  return <div id={containerId} className="mb-4 w-full" />;
});

export default CaptchaField;
