/** All UI lives in a shadow root, so page styles can't break it and it can't break the page. */
export const CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
.banner { position: fixed; top: 0; left: 0; right: 0; z-index: 2147483646; padding: 14px 20px;
  font-size: 20px; line-height: 1.4; color: #4a3200; background: #fff4d6; border-bottom: 3px solid #e0a800;
  box-shadow: 0 2px 10px rgba(0,0,0,.2); max-height: 85vh; overflow: auto; }
.banner.high { color: #6b1111; background: #fde8e8; border-bottom-color: #c62828; }
.row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.grow { flex: 1 1 320px; }
.photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 0 0 2px #1f6f5c; flex: none; }
.photo.big { width: 120px; height: 120px; }
button, .btn { font-size: 19px; padding: 10px 18px; border-radius: 10px; border: 2px solid #1f6f5c; background: #fff;
  color: #1f6f5c; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 600; }
button.primary, .btn.primary { background: #1f6f5c; color: #fff; }
button:focus-visible, .btn:focus-visible, a:focus-visible { outline: 3px solid #e0a800; outline-offset: 2px; }
ul { margin: 8px 0 8px 0; padding-left: 26px; }
li { margin: 6px 0; }
a { color: #0b57d0; }
.details { margin-top: 10px; }
.overlay { position: fixed; inset: 0; z-index: 2147483647; background: rgba(15, 30, 26, .72);
  display: flex; align-items: flex-start; justify-content: center; overflow: auto; padding: 24px 12px; }
.card { background: #fff; color: #1d1d1d; max-width: 760px; width: 100%; border-radius: 18px; padding: 28px;
  font-size: 20px; line-height: 1.45; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
.card h1 { font-size: 30px; margin: 0 0 6px; color: #1f6f5c; }
.card h2 { font-size: 22px; margin: 20px 0 6px; }
.card.danger h1 { color: #b71c1c; }
.personal { font-size: 21px; background: #eef7f4; border-radius: 12px; padding: 14px 16px; margin: 14px 0; }
.scammer-note { background: #fff4d6; border-left: 6px solid #e0a800; padding: 12px 14px; border-radius: 8px; margin: 16px 0; }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0 6px; }
.unlock { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 14px; font-size: 17px; color: #444; }
.unlock input { font-size: 20px; padding: 8px 10px; width: 9em; border: 2px solid #999; border-radius: 8px; letter-spacing: 2px; }
.unlock .msg { margin-top: 6px; min-height: 1.2em; }
.small { font-size: 16px; }
`;
