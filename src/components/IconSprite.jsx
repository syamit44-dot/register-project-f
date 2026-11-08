// สไปรท์ไอคอนทั้งหมด render ครั้งเดียวใน App แล้วเรียกใช้ผ่าน <svg className="icon"><use href="#i-xxx"/></svg>
export function IconSprite() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
      <defs>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></symbol>
        <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/></symbol>
        <symbol id="i-building-store" viewBox="0 0 24 24"><path d="M4 9V6l2-3h12l2 3v3"/><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v10h14V9"/><path d="M9 19v-5h6v5"/></symbol>
        <symbol id="i-shield-check" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3 7.5-7 9-4-1.5-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></symbol>
        <symbol id="i-shield-cog" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3 7.5-7 9-4-1.5-7-4-7-9V6l7-3z"/><circle cx="12" cy="12" r="2.1"/><path d="M12 8.4v1.3"/><path d="M12 14.3v1.3"/><path d="M15.6 12h-1.3"/><path d="M9.7 12H8.4"/><path d="M14.5 9.5l-.9.9"/><path d="M10.4 13.6l-.9.9"/><path d="M14.5 14.5l-.9-.9"/><path d="M10.4 10.4l-.9-.9"/></symbol>
        <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></symbol>
        <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></symbol>
        <symbol id="i-router" viewBox="0 0 24 24"><path d="M4 11h16v6H4z"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><path d="M7 17v1"/><path d="M12 17v1"/></symbol>
        <symbol id="i-temperature" viewBox="0 0 24 24"><path d="M10 14V5a2 2 0 0 1 4 0v9"/><circle cx="12" cy="17" r="3"/></symbol>
        <symbol id="i-building-warehouse" viewBox="0 0 24 24"><path d="M4 10 12 4l8 6"/><path d="M5 10v9h14v-9"/><path d="M10 19v-6h4v6"/></symbol>
        <symbol id="i-barn" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><rect x="10" y="6" width="4" height="4" rx="0.5"/><path d="M8 15a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6H8z"/><path d="M8 14.5l4 3.5 4-3.5"/><path d="M8 21l4-3.5 4 3.5"/><path d="M1 17.5h4"/><path d="M19 17.5h4"/><path d="M2.5 15.5v4"/><path d="M21.5 15.5v4"/></symbol>
        <symbol id="i-egg" viewBox="0 0 24 24"><path d="M19 14.5a7 7 0 0 1-14 0C5 10 8.5 3 12 3s7 7 7 11.5Z"/></symbol>
        <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M20 4C9 4 5 8 5 14a5 5 0 0 0 5 5c6 0 10-4 10-15Z"/><path d="M4 20l10-10"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></symbol>
        <symbol id="i-info-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></symbol>
        <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></symbol>
        <symbol id="i-clipboard-text" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="1"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M9 11h6"/><path d="M9 15h6"/></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></symbol>
        <symbol id="i-cloud-upload" viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-1-7.9 5 5 0 0 1 9.6-1.8A4.5 4.5 0 0 1 17 18H7z"/><path d="M12 10v7"/><path d="M9.5 12.5L12 10l2.5 2.5"/></symbol>
        <symbol id="i-circle-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></symbol>
        <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></symbol>
        <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></symbol>
        <symbol id="i-edit" viewBox="0 0 24 24"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/><path d="M14.5 5.5l4 4"/></symbol>
        <symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M16 8l4 4-4 4"/><path d="M20 12H9"/></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h3.5l1.5 4.5-2 1.5a10.5 10.5 0 0 0 5 5l1.5-2 4.5 1.5V18a2 2 0 0 1-2 2C10 20 4 14 4 6.5A2 2 0 0 1 5 4z"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 11a6 6 0 0 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></symbol>
        <symbol id="i-message-circle" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.2-3.6A7.9 7.9 0 0 1 4 12z"/><path d="M8.5 11h7"/><path d="M8.5 14h4.5"/></symbol>
      <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
        <symbol id="i-device" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/><circle cx="12" cy="12" r="2"/><path d="M9 7V4"/><path d="M15 7V4"/><path d="M9 20v-3"/><path d="M15 20v-3"/><path d="M7 9H4"/><path d="M7 15H4"/><path d="M20 9h-3"/><path d="M20 15h-3"/></symbol>
      </defs>
    </svg>
  );
}

export default IconSprite;
