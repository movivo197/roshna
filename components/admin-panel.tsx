"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowUpLeft, BookOpen, Check, ChevronLeft, Eye, EyeOff, FileText, Flag, LayoutDashboard, Leaf, LockKeyhole, LogOut, Megaphone, Plus, Save, Search, Settings2, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { appConfigSchema, type AppConfig, type Resource } from "../lib/app-config";

import { ThemePicker } from "./theme";
import UsageAdmin from "./usage-admin";
import CommunityAdmin from "./community-admin";
import OperationsAdmin from "./operations-admin";

type Area = "overview" | "resources" | "community" | "settings";
type Status = { kind: "error" | "success"; text: string } | null;
const categoryNames: Record<Resource["category"], string> = { awareness: "خودشناسی", planning: "برنامه‌ریزی", habits: "عادت‌سازی" };
const number = (value: number) => value.toLocaleString("fa-IR");

async function adminRequest(body?: object) {
  const res = await fetch("/api/admin", { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(20000) });
  let data: { config?: AppConfig; error?: string; configured?: boolean };
  try { data = await res.json(); } catch { throw new Error("پاسخ سرور معتبر نیست. اتصال و تنظیمات سرور را بررسی کنید."); }
  return { res, data };
}

export function AdminPanel() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [area, setArea] = useState<Area>("overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    let active = true;
    adminRequest().then(({ res, data }) => {
      if (!active) return;
      if (res.ok && data.config) setConfig(data.config);
      else if (res.status === 401) setConfigured(data.configured !== false);
      else setStatus({ kind: "error", text: data.error || "دریافت اطلاعات ممکن نشد." });
    }).catch(() => { if (active) setStatus({ kind: "error", text: "پنل مدیریت به اینترنت نیاز دارد. اتصال خود را بررسی کنید." }); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  const update = useCallback((next: AppConfig) => { setConfig(next); setDirty(true); setStatus(null); }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setStatus(null);
    try {
      const { res, data } = await adminRequest({ action: "login", password });
      if (!res.ok || !data.config) throw new Error(data.error || "ورود ممکن نشد.");
      setConfig(data.config); setPassword(""); setDirty(false);
    } catch (error) { setStatus({ kind: "error", text: error instanceof Error ? error.message : "اتصال به سرور برقرار نشد." }); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!config || busy) return;
    const parsed = appConfigSchema.safeParse(config);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const resourceIndex = typeof issue.path[1] === "number" ? issue.path[1] : undefined;
      if (issue.path[0] === "resources") { setArea("resources"); if (resourceIndex !== undefined) setSelected(config.resources[resourceIndex]?.id || null); }
      else setArea("settings");
      setStatus({ kind: "error", text: "اطلاعات معتبر نیست. عنوان، متن تمرین، مدت زمان و پیوند https را بررسی کنید. نام برنامه باید ۲ تا ۴۰ حرف باشد." });
      return;
    }
    setBusy(true); setStatus(null);
    try {
      const { res, data } = await adminRequest({ action: "save", config: parsed.data });
      if (!res.ok || !data.config) throw new Error(data.error || "ذخیره انجام نشد.");
      setConfig(data.config); setDirty(false); setStatus({ kind: "success", text: "تغییرات ذخیره شد. کاربران در اتصال بعدی به اینترنت، محتوای تازه را دریافت می‌کنند." });
    } catch (error) { setStatus({ kind: "error", text: error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید." }); }
    finally { setBusy(false); }
  }

  async function logout() {
    if (dirty && !window.confirm("تغییرات ذخیره نشده است. از پنل خارج می‌شوید؟")) return;
    setBusy(true);
    try {
      const { res, data } = await adminRequest({ action: "logout" });
      if (!res.ok && res.status !== 401) throw new Error(data.error || "خروج انجام نشد.");
      setConfig(null); setDirty(false); setStatus(null); setSelected(null);
    } catch { setStatus({ kind: "error", text: "خروج انجام نشد. اتصال خود را بررسی کنید و دوباره تلاش کنید." }); }
    finally { setBusy(false); }
  }

  function addResource() {
    if (!config) return;
    if (config.resources.length >= 100) { setStatus({ kind: "error", text: "حداکثر ۱۰۰ تمرین قابل نگهداری است." }); return; }
    const resource: Resource = { id: crypto.randomUUID(), title: "تمرین تازه", category: "awareness", description: "", body: "", minutes: 5, published: false, url: "" };
    update({ ...config, resources: [...config.resources, resource] }); setSelected(resource.id); setArea("resources"); setSearch(""); setFilter("all");
  }

  function changeResource(patch: Partial<Resource>) {
    if (!config || !selected) return;
    update({ ...config, resources: config.resources.map((resource) => resource.id === selected ? { ...resource, ...patch } : resource) });
  }

  function removeResource(id: string) {
    if (!config || !window.confirm("این تمرین حذف شود؟ حذف پس از ذخیرهٔ تغییرات اعمال می‌شود.")) return;
    update({ ...config, resources: config.resources.filter((resource) => resource.id !== id) });
    if (selected === id) setSelected(null);
  }

  if (loading) return <main className="admin-root admin-loading" dir="rtl"><Leaf size={36} /><p role="status">در حال بررسی دسترسی…</p></main>;

  if (!config) return <main className="admin-root admin-auth" dir="rtl">
    <div className="admin-auth-theme"><ThemePicker compact /></div>
    <a href="/" className="admin-auth-back">بازگشت به روشنا <ArrowUpLeft size={17} /></a>
    <section className="admin-login-card">
      <div className="admin-logo-mark"><Leaf size={29} /></div>
      <div className="admin-eyebrow">فضایی برای رشد</div>
      <h1>مدیریت روشنا</h1><p className="admin-muted">محتوا و هویت برنامه را از اینجا مدیریت کنید.</p>
      {!configured && <div className="admin-status admin-status-error">پنل هنوز راه‌اندازی نشده است. ابتدا دستور <bdi><code>npm run setup:admin</code></bdi> را روی سرور اجرا کنید و برنامه را دوباره راه‌اندازی کنید.</div>}
      <form onSubmit={login} className="admin-login-form">
        <label htmlFor="admin-password">رمز مدیر</label>
        <div className="admin-password"><LockKeyhole size={18} /><input id="admin-password" name="password" type={visiblePassword ? "text" : "password"} autoComplete="current-password" dir="ltr" maxLength={512} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy || !configured} /><button type="button" onClick={() => setVisiblePassword(!visiblePassword)} aria-label={visiblePassword ? "پنهان کردن رمز" : "نمایش رمز"}>{visiblePassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
        {status && <div role="alert" className={`admin-status admin-status-${status.kind}`}>{status.text}</div>}
        <button type="submit" className="admin-button admin-primary" disabled={busy || !configured}>{busy ? "در حال ورود…" : "ورود به پنل"}<ChevronLeft size={18} /></button>
      </form>
      <div className="admin-login-note"><ShieldCheck size={17} /><span>دسترسی محافظت‌شده • نیازمند اینترنت</span></div>
    </section>
    <p className="admin-auth-footer">یادداشت‌ها و برنامه‌های شخصی در دستگاه کاربر می‌مانند؛ مدیریت جامعه فقط گزارش‌ها و حساب‌های آنلاین را می‌بیند.</p>
  </main>;

  const published = config.resources.filter((resource) => resource.published).length;
  const current = config.resources.find((resource) => resource.id === selected);
  const resources = config.resources.filter((resource) => (filter === "all" || (filter === "published" ? resource.published : !resource.published)) && `${resource.title} ${resource.description}`.includes(search));
  const areaNames: Record<Area, string> = { overview: "نمای کلی", resources: "کتابخانهٔ رشد", community: "مدیریت جامعه", settings: "تنظیمات برنامه" };

  return <div className="admin-root admin-shell" dir="rtl">
    <aside className="admin-sidebar" aria-label="منوی مدیریت">
      <a className="admin-brand" href="/"><span className="admin-logo-mark"><Leaf size={25} /></span><span><strong>{config.name}</strong><small>پنل مدیریت</small></span></a>
      <div className="admin-side-label">مدیریت فضای رشد</div>
      <nav className="admin-nav">
        <button className={area === "overview" ? "is-active" : ""} onClick={() => setArea("overview")} aria-current={area === "overview" ? "page" : undefined}><LayoutDashboard size={20} />نمای کلی</button>
        <button className={area === "resources" ? "is-active" : ""} onClick={() => setArea("resources")} aria-current={area === "resources" ? "page" : undefined}><BookOpen size={20} />کتابخانهٔ رشد<span>{number(config.resources.length)}</span></button>
        <button className={area === "community" ? "is-active" : ""} onClick={() => setArea("community")} aria-current={area === "community" ? "page" : undefined}><Flag size={20} />مدیریت جامعه</button>
        <button className={area === "settings" ? "is-active" : ""} onClick={() => setArea("settings")} aria-current={area === "settings" ? "page" : undefined}><Settings2 size={20} />تنظیمات برنامه</button>
      </nav>
      <div className="admin-side-bottom"><div className="admin-privacy"><ShieldCheck size={22} /><p>حریم خصوصی در اولویت<small>یادداشت‌ها، هدف‌ها و عادت‌های کاربران در این پنل قابل مشاهده نیست.</small></p></div><a href="/" className="admin-site-link">مشاهدهٔ برنامه<ArrowUpLeft size={18} /></a><button className="admin-logout" disabled={busy} onClick={logout}><LogOut size={18} />خروج امن</button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><span className="admin-eyebrow">پنل مدیریت / {areaNames[area]}</span><h1>{areaNames[area]}</h1></div><div className="admin-top-actions"><ThemePicker compact /><span className={`admin-save-state${dirty ? " is-dirty" : ""}`}>{dirty ? "تغییرات ذخیره نشده" : <><Check size={15} /> ذخیره‌شده</>}</span><button className="admin-button admin-primary" onClick={save} disabled={busy || !dirty}><Save size={17} />{busy ? "لطفاً صبر کنید…" : "ذخیرهٔ تغییرات"}</button></div></header>
      {status && <div className={`admin-status admin-status-${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>{status.text}</div>}
      <fieldset className="admin-workspace" disabled={busy}>
      {area === "overview" && <>
        <section className="admin-welcome"><div><span className="admin-eyebrow">یک فضای کوچک، برای تغییرهای ماندگار</span><h2>رشد، از یک قدم روشن شروع می‌شود.</h2><p>تمرین‌های کاربردی منتشر کنید و تجربهٔ کاربران روشنا را شکل دهید.</p><button className="admin-button admin-light" onClick={addResource}><Plus size={18} />افزودن تمرین تازه</button></div><Leaf className="admin-welcome-leaf" size={160} strokeWidth={1} aria-hidden="true" /></section>
        <div className="admin-stats"><Stat title="کل تمرین‌ها" value={config.resources.length} icon={<BookOpen size={22} />} note="در کتابخانهٔ شما" /><Stat title="منتشرشده" value={published} icon={<Eye size={22} />} note="قابل دریافت در برنامه" /><Stat title="پیش‌نویس" value={config.resources.length - published} icon={<FileText size={22} />} note="فقط قابل مشاهده برای مدیر" /></div>
        <div className="admin-overview-grid"><section className="admin-card"><div className="admin-card-heading"><h2>آخرین تمرین‌ها</h2><button className="admin-text-button" onClick={() => setArea("resources")}>مشاهدهٔ همه<ChevronLeft size={16} /></button></div>{config.resources.slice(-4).reverse().map((resource) => <button key={resource.id} className="admin-recent-resource" onClick={() => { setSelected(resource.id); setArea("resources"); }}><span className="admin-resource-icon"><BookOpen size={20} /></span><span><strong>{resource.title}</strong><small>{categoryNames[resource.category]} · {number(resource.minutes)} دقیقه</small></span><span className={`admin-badge${resource.published ? " is-published" : ""}`}>{resource.published ? "منتشرشده" : "پیش‌نویس"}</span></button>)}{!config.resources.length && <p className="admin-muted">هنوز تمرینی اضافه نشده است.</p>}</section><section className="admin-card admin-notice-card"><Megaphone size={28} /><h2>پیام شما برای کاربران</h2><p>{config.announcement || "یک پیام کوتاه برای شروع هفته یا معرفی محتوای تازه تنظیم کنید."}</p><button className="admin-text-button" onClick={() => setArea("settings")}>ویرایش پیام<ChevronLeft size={16} /></button><div className="admin-info"><Wifi size={18} /><span>محتوای تازه هنگام اتصال دریافت می‌شود و نسخهٔ دریافت‌شده آفلاین هم در دسترس می‌ماند.</span></div></section></div>
        <UsageAdmin />
        <OperationsAdmin />
      </>}

      {area === "settings" && <section className="admin-card admin-settings"><div className="admin-card-heading"><div><h2>هویت و پیام برنامه</h2><p className="admin-muted">این اطلاعات پس از ذخیره و اتصال کاربر به‌روز می‌شود.</p></div><Settings2 size={24} /></div><label className="admin-field">نام برنامه<input value={config.name} minLength={2} maxLength={40} required onChange={(event) => update({ ...config, name: event.target.value })} /><small>نامی کوتاه و خوانا؛ حداکثر ۴۰ حرف.</small></label><label className="admin-field">شعار کوتاه<input value={config.tagline} maxLength={140} onChange={(event) => update({ ...config, tagline: event.target.value })} /></label><label className="admin-field">پیام عمومی<textarea rows={4} value={config.announcement} maxLength={500} placeholder="مثلاً: این هفته، فقط روی یک قدم کوچک تمرکز کنیم." onChange={(event) => update({ ...config, announcement: event.target.value })} /><small>{number(config.announcement.length)} از ۵۰۰ حرف؛ برای پنهان کردن پیام، این کادر را خالی بگذارید.</small></label><div className="admin-info"><ShieldCheck size={21} /><span>برای تغییر رمز مدیر، دستور <bdi><code>npm run setup:admin -- --reset</code></bdi> را روی سرور اجرا و برنامه را دوباره راه‌اندازی کنید. تغییر نام در این بخش، نام و آیکون نصب‌شدهٔ سیستم‌عامل را تغییر نمی‌دهد.</span></div></section>}

      {area === "community" && <CommunityAdmin />}

      {area === "resources" && <>
        <div className="admin-library-toolbar"><div className="admin-search"><Search size={18} /><input type="search" placeholder="جستجو در تمرین‌ها…" aria-label="جستجوی تمرین" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="وضعیت انتشار"><option value="all">همهٔ وضعیت‌ها</option><option value="published">منتشرشده</option><option value="draft">پیش‌نویس</option></select><button className="admin-button admin-primary" onClick={addResource}><Plus size={17} />تمرین تازه</button></div>
        <div className={`admin-library-grid${current ? " has-editor" : ""}`}>
          <section className="admin-resource-list" aria-label="فهرست تمرین‌ها">{resources.map((resource) => <article key={resource.id} className={`admin-card admin-resource-row${selected === resource.id ? " is-selected" : ""}`}><div className="admin-resource-row-top"><span className="admin-category">{categoryNames[resource.category]}</span><span className={`admin-badge${resource.published ? " is-published" : ""}`}>{resource.published ? "منتشرشده" : "پیش‌نویس"}</span></div><h2>{resource.title}</h2><p>{resource.description || "توضیح کوتاهی برای این تمرین بنویسید."}</p><div className="admin-resource-row-bottom"><small>{number(resource.minutes)} دقیقه مطالعه</small><button className="admin-text-button" onClick={() => setSelected(resource.id)}>ویرایش تمرین<ChevronLeft size={16} /></button></div></article>)}{!resources.length && <div className="admin-card admin-empty"><BookOpen size={34} /><h2>تمرینی پیدا نشد</h2><p>جستجو و فیلتر را تغییر دهید یا یک تمرین تازه بسازید.</p></div>}</section>
          {current && <section className="admin-card admin-editor" aria-label="ویرایش تمرین"><div className="admin-card-heading"><h2>ویرایش تمرین</h2><button className="admin-text-button" onClick={() => setSelected(null)}>بستن</button></div><label className="admin-field">عنوان<input maxLength={120} minLength={2} required value={current.title} onChange={(event) => changeResource({ title: event.target.value })} /></label><div className="admin-form-row"><label className="admin-field">دسته‌بندی<select value={current.category} onChange={(event) => changeResource({ category: event.target.value as Resource["category"] })}><option value="awareness">خودشناسی</option><option value="planning">برنامه‌ریزی</option><option value="habits">عادت‌سازی</option></select></label><label className="admin-field">زمان مطالعه (دقیقه)<input type="number" min={1} max={180} required value={current.minutes || ""} onChange={(event) => changeResource({ minutes: Number(event.target.value) })} /></label></div><label className="admin-field">توضیح کوتاه<textarea rows={2} maxLength={300} value={current.description} onChange={(event) => changeResource({ description: event.target.value })} /></label><label className="admin-field">متن تمرین<textarea rows={12} minLength={10} maxLength={20000} required value={current.body} onChange={(event) => changeResource({ body: event.target.value })} /><small>متن ساده بنویسید؛ بین بندها یک خط خالی بگذارید. حداقل ۱۰ حرف.</small></label><label className="admin-field">پیوند تکمیلی (اختیاری)<input type="url" dir="ltr" placeholder="https://…" maxLength={2048} value={current.url} onChange={(event) => changeResource({ url: event.target.value })} /><small>پیوندهای بیرونی به اینترنت نیاز دارند.</small></label><label className="admin-toggle"><input type="checkbox" checked={current.published} onChange={(event) => changeResource({ published: event.target.checked })} /><span><strong>انتشار در برنامه</strong><small>با ذخیرهٔ تغییرات، در کتابخانهٔ کاربران نمایش داده می‌شود.</small></span></label><div className="admin-editor-bottom"><button className="admin-button admin-primary" onClick={save} disabled={!dirty}><Save size={17} />ذخیرهٔ تغییرات</button><button className="admin-delete" onClick={() => removeResource(current.id)}><Trash2 size={17} />حذف تمرین</button></div></section>}
        </div>
      </>}
      </fieldset>
      <footer className="admin-footer">{config.name} · فضای رشد شخصی<span>مدیریت محتوا روی سرور؛ اطلاعات شخصی روی دستگاه کاربر</span></footer>
    </main>
  </div>;
}

function Stat({ title, value, icon, note }: { title: string; value: number; icon: React.ReactNode; note: string }) {
  return <section className="admin-card admin-stat"><div className="admin-stat-top"><span>{title}</span><span className="admin-stat-icon">{icon}</span></div><strong>{number(value)}</strong><small>{note}</small></section>;
}
