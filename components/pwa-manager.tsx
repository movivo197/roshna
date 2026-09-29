"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export type PwaStatus = { online: boolean; ready: boolean; installed: boolean; updateAvailable: boolean };
type Props = { visible?: boolean; onStatusChange?: (status: PwaStatus) => void };

/** Mount once with the application; visible=false hides controls but keeps offline setup active. */
export function PwaManager({ visible = true, onStatusChange }: Props) {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [supported, setSupported] = useState(true);
  const [applying, setApplying] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyRequested = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  useEffect(() => {
    onStatusRef.current?.({ online, ready, installed, updateAvailable: !!waiting });
  }, [online, ready, installed, waiting]);

  useEffect(() => {
    let alive = true;
    const observed = new WeakSet<ServiceWorker>();
    const display = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    setOnline(navigator.onLine);
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    updateInstalled();
    const captureInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const didInstall = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", didInstall);
    display.addEventListener("change", updateInstalled);

    async function queryStatus() {
      const worker = registrationRef.current?.active;
      if (!worker) { if (alive) setReady(false); return false; }
      const result = await new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => { channel.port1.close(); resolve(false); }, 8000);
        channel.port1.onmessage = (event) => {
          window.clearTimeout(timeout); channel.port1.close(); resolve(event.data?.ready === true);
        };
        worker.postMessage({ type: "OFFLINE_STATUS" }, [channel.port2]);
      });
      if (alive) setReady(result);
      return result;
    }

    function observe(registration: ServiceWorkerRegistration) {
      if (!alive) return;
      setWaiting(registration.waiting);
      const worker = registration.installing;
      if (!worker || observed.has(worker)) return;
      observed.add(worker);
      setBusy(true);
      worker.addEventListener("statechange", () => {
        if (!alive) return;
        if (worker.state === "installed") {
          setWaiting(registration.waiting);
          setBusy(false);
          void queryStatus();
        } else if (worker.state === "activated") {
          setBusy(false); setError(""); void queryStatus();
        } else if (worker.state === "redundant") {
          setBusy(false);
          setError("دریافت فایل‌های آفلاین کامل نشد؛ اتصال و فضای خالی دستگاه را بررسی و دوباره تلاش کنید.");
          void queryStatus();
        }
      });
    }

    const onNetwork = () => { if (alive) setOnline(navigator.onLine); void queryStatus(); };
    const onController = () => {
      if (applyRequested.current) window.location.reload();
      else void queryStatus();
    };
    const onFocus = () => { if (alive) void queryStatus(); };
    window.addEventListener("online", onNetwork);
    window.addEventListener("offline", onNetwork);
    window.addEventListener("focus", onFocus);

    async function register() {
      if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        if (alive) { setSupported(false); setBusy(false); }
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        if (alive) { setBusy(false); setError("آماده‌سازی آفلاین در نسخه نهایی فعال می‌شود."); }
        return;
      }
      try {
        if (alive) { setBusy(true); setError(""); }
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        registrationRef.current = registration;
        registration.addEventListener("updatefound", () => observe(registration));
        observe(registration);
        if (!registration.installing && alive) setBusy(false);
        await queryStatus();
      } catch {
        if (alive) { setBusy(false); setError("آماده‌سازی آفلاین انجام نشد. اتصال اینترنت و فعال‌بودن HTTPS را بررسی کنید."); }
      }
    }
    refreshRef.current = async () => {
      await register();
      try { await registrationRef.current?.update(); } catch { /* The registration message explains a failure. */ }
      const isReady = await queryStatus();
      const active = registrationRef.current?.active;
      if (!isReady && active && navigator.onLine) {
        if (alive) setBusy(true);
        const repaired = await new Promise<boolean>((resolve) => {
          const channel = new MessageChannel();
          const timeout = window.setTimeout(() => { channel.port1.close(); resolve(false); }, 120000);
          channel.port1.onmessage = (event) => { window.clearTimeout(timeout); channel.port1.close(); resolve(event.data?.ready === true); };
          active.postMessage({ type: "PREPARE_OFFLINE" }, [channel.port2]);
        });
        if (alive) {
          setBusy(false); setReady(repaired);
          if (!repaired) setError("فایل‌های آفلاین کامل دریافت نشدند. اتصال، فضای خالی و در صورت وجود، دکمه نسخه جدید را بررسی کن.");
        }
      }
    };
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", onController);
    void register();
    return () => {
      alive = false;
      window.removeEventListener("beforeinstallprompt", captureInstall);
      window.removeEventListener("appinstalled", didInstall);
      display.removeEventListener("change", updateInstalled);
      window.removeEventListener("online", onNetwork);
      window.removeEventListener("offline", onNetwork);
      window.removeEventListener("focus", onFocus);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  }

  if (!visible) return null;
  return <section className="g-pwa" aria-label="نصب و دسترسی آفلاین">
    <div className="g-pwa-title"><strong>روشنا همیشه همراه تو</strong><span className={online ? "g-pwa-dot online" : "g-pwa-dot"}>{online ? "متصل" : "آفلاین"}</span></div>
    <p role="status" aria-live="polite">{ready ? "نسخه آفلاین آماده است؛ برنامه‌ریزی، عادت‌ها و یادداشت‌ها بدون اینترنت در دسترس‌اند." : busy ? "در حال آماده‌سازی فایل‌ها برای استفاده آفلاین… این بار صفحه را باز نگه دار." : "نسخه آفلاین هنوز آماده نیست. یک بار با اینترنت، آماده‌سازی را کامل کن."}</p>
    {!supported && <p>برای نصب و دسترسی آفلاین، این آدرس را با HTTPS در مرورگری مانند Chrome یا Safari باز کن.</p>}
    {error && <p className="g-pwa-note">{error}</p>}
    <div className="g-pwa-actions">
      {installed ? <span className="g-pwa-note">✓ برنامه روی این دستگاه نصب است</span> : installEvent ? <button type="button" className="g-btn" onClick={() => void install()}>نصب روشنا</button> : null}
      {waiting && <button type="button" className="g-btn" disabled={applying} onClick={() => { applyRequested.current = true; setApplying(true); waiting.postMessage({ type: "APPLY_UPDATE" }); }}>{applying ? "در حال به‌روزرسانی…" : "دریافت نسخه جدید و بازگشایی"}</button>}
      {!busy && supported && <button type="button" className="g-btn g-pwa-secondary" onClick={() => void refreshRef.current()}>{ready ? "بررسی نسخه جدید" : "تلاش دوباره"}</button>}
    </div>
    {waiting && <p className="g-pwa-note">نسخه جدید آماده است. با انتخاب دکمه، برنامه دوباره باز می‌شود؛ داده‌های شخصی ذخیره‌شده باقی می‌مانند.</p>}
    {!installed && !installEvent && <details><summary>راهنمای نصب روی دستگاه</summary>{ios ? <p>در Safari، منوی اشتراک‌گذاری (Share) را باز کن و «Add to Home Screen / افزودن به صفحه اصلی» را بزن؛ سپس Add را انتخاب کن.</p> : <p>در Chrome یا Edge منوی مرورگر را باز کن و «Install app / نصب برنامه» یا «Add to Home screen / افزودن به صفحه اصلی» را بزن. نمایش این گزینه به مرورگر و تکمیل آماده‌سازی بستگی دارد.</p>}</details>}
    <p className="g-pwa-note">پنل مدیریت و دریافت محتوای تازه به اینترنت نیاز دارند. داده‌های شخصی در همین مرورگرند؛ از بخش پشتیبان‌گیری، مرتب خروجی بگیر.</p>
    <style jsx>{`
      .g-pwa{background:#f7f8f4;border:1px solid #dce6df;border-radius:20px;padding:22px;color:#184d42;line-height:1.9}
      .g-pwa-title{display:flex;align-items:center;justify-content:space-between;gap:14px}.g-pwa-title strong{font-size:17px}
      .g-pwa p{margin:12px 0;font-size:14px}.g-pwa .g-pwa-note{font-size:12px;color:#5d716a}
      .g-pwa-dot{font-size:11px;padding:2px 10px;border-radius:20px;background:#ecece4;color:#626650;white-space:nowrap}
      .g-pwa-dot.online{background:#deeddf;color:#215844}.g-pwa-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0}
      .g-pwa-secondary{background:transparent!important;color:#184d42!important;border:1px solid #b9ccc1!important}
      .g-pwa details{font-size:13px;margin-top:12px}.g-pwa summary{cursor:pointer}.g-pwa button:disabled{opacity:.6;cursor:wait}
    `}</style>
  </section>;
}
