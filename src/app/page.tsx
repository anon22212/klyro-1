"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { demoProjects, Project } from "@/lib/projects";
import { ArrowUpRight, Bookmark, BookmarkCheck, CheckCircle2, Globe2, Heart, Layers3, Plus, Search, Sparkles, Users, X, Zap } from "lucide-react";

type Lang = "ru" | "en";
type Modal = "create" | "auth" | null;

const copy = {
  ru: {
    nav: ["Проекты", "Напарники", "Как это работает"],
    login: "Войти", logout: "Выйти", create: "Создать проект",
    eyebrow: "ПЛАТФОРМА ДЛЯ ТЕХ, КТО СОЗДАЁТ",
    titleA: "Хорошие идеи", titleB: "нуждаются в людях.",
    subtitle: "KLYRO помогает найти напарника, собрать команду и довести идею до первого релиза.",
    browse: "Смотреть проекты", projects: "Проекты сообщества",
    fresh: "Находи людей по навыкам, стеку и тому, как вы хотите работать.",
    all: "Все", partner: "Ищу напарника", team: "Собираю команду",
    search: "Поиск по проектам, навыкам, технологиям",
    saved: "Сохранённые", members: "участников", join: "Откликнуться",
    noResults: "По этому запросу пока ничего нет.", open: "Открыть проект",
    how: "Как это работает", howTitle: "Меньше случайных чатов. Больше запуска.",
    steps: [["Опубликуй идею", "Опиши, кого ищешь и что уже сделано."], ["Найди своих", "Фильтруй проекты по навыкам и инструментам."], ["Начните строить", "Откликнись и преврати разговор в продукт."]],
    cta: "Есть идея, которую пора запустить?", ctaSub: "Опубликуй её и найди тех, кому это тоже интересно.", start: "Начать бесплатно",
    auth: "Войти в KLYRO", email: "Электронная почта", password: "Пароль", signIn: "Войти", signUp: "Создать аккаунт", google: "Продолжить с Google",
    createTitle: "Новый проект", projectName: "Название проекта", description: "Что вы создаёте?", category: "Категория", skills: "Нужные навыки через запятую", tools: "AI-инструменты через запятую", image: "Обложка проекта", collaboration: "Формат поиска", publish: "Опубликовать", back: "Назад",
    sent: "Отклик отправлен", published: "Проект опубликован", added: "Сохранено", removed: "Убрано из сохранённых", signInFirst: "Войди, чтобы откликнуться",
    googleHelp: "Вход через Google ещё не настроен в Supabase."
  },
  en: {
    nav: ["Projects", "Partners", "How it works"],
    login: "Log in", logout: "Log out", create: "Start a project",
    eyebrow: "A PLATFORM FOR PEOPLE WHO MAKE THINGS",
    titleA: "Good ideas", titleB: "need good people.",
    subtitle: "KLYRO helps you find a partner, build a team, and take an idea to its first release.",
    browse: "Explore projects", projects: "Community projects",
    fresh: "Meet people by skills, stack, and the way you want to work.",
    all: "All", partner: "Find a partner", team: "Build a team",
    search: "Search projects, skills, technologies",
    saved: "Saved", members: "members", join: "I’m interested",
    noResults: "Nothing matches this search yet.", open: "Open project",
    how: "How it works", howTitle: "Fewer random chats. More shipping.",
    steps: [["Share the idea", "Explain what you are building and who you need."], ["Find your people", "Filter projects by skills and favourite AI tools."], ["Start building", "Apply and turn a conversation into a product."]],
    cta: "Have an idea ready to ship?", ctaSub: "Publish it and meet people who want to make it real.", start: "Start for free",
    auth: "Welcome to KLYRO", email: "Email address", password: "Password", signIn: "Sign in", signUp: "Create account", google: "Continue with Google",
    createTitle: "New project", projectName: "Project name", description: "What are you building?", category: "Category", skills: "Skills needed, comma separated", tools: "AI tools, comma separated", image: "Project cover", collaboration: "Looking for", publish: "Publish project", back: "Back",
    sent: "Application sent", published: "Project published", added: "Saved", removed: "Removed from saved", signInFirst: "Log in to apply",
    googleHelp: "Google sign-in is not configured in Supabase yet."
  }
};

const isDbId = (id: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const t = copy[lang];

  useEffect(() => {
    const localProjects = localStorage.getItem("klyro-projects");
    const localSaved = localStorage.getItem("klyro-saved");
    if (localProjects) setProjects(JSON.parse(localProjects));
    if (localSaved) setSaved(JSON.parse(localSaved));
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    supabase.from("projects").select("id,title,description,category,skills,technologies,image_url,collaboration_type,profiles(display_name)").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error || !data?.length) return;
      setProjects(data.map((item: any) => ({
        id: item.id, title: item.title, description: item.description, category: item.category,
        skills: item.skills ?? [], tools: item.technologies ?? [], imageUrl: item.image_url ?? undefined,
        members: 1, owner: item.profiles?.display_name || "KLYRO member",
        kind: item.collaboration_type === "partner" ? "Ищу напарника" : "Ищу команду", emoji: "✦"
      })));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const shown = useMemo(() => projects.filter(project => {
    const search = [project.title, project.description, project.category, ...project.skills, ...project.tools].join(" ").toLowerCase();
    const typeMatch = filter === "all" || (filter === "partner" ? project.kind === "Ищу напарника" : project.kind === "Ищу команду");
    return typeMatch && (!query || search.includes(query.toLowerCase()));
  }), [projects, filter, query]);

  function notice(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [id, ...saved];
    setSaved(next);
    localStorage.setItem("klyro-saved", JSON.stringify(next));
    notice(saved.includes(id) ? t.removed : t.added);
  }

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("image") as File;
    let imageUrl = imagePreview;

    if (file?.size && supabase && user) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = user.id + "/" + crypto.randomUUID() + "." + ext;
      const upload = await supabase.storage.from("project-images").upload(path, file);
      if (upload.error) return notice(upload.error.message);
      imageUrl = supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
    }

    const project: Project = {
      id: Date.now().toString(),
      title: String(form.get("title")),
      description: String(form.get("description")),
      category: String(form.get("category")),
      skills: String(form.get("skills")).split(",").map(x => x.trim()).filter(Boolean),
      tools: String(form.get("tools")).split(",").map(x => x.trim()).filter(Boolean),
      members: 1,
      owner: user?.user_metadata?.name || user?.email?.split("@")[0] || "KLYRO member",
      kind: String(form.get("kind")),
      emoji: "✦",
      imageUrl
    };

    const next = [project, ...projects];
    setProjects(next);
    localStorage.setItem("klyro-projects", JSON.stringify(next));

    if (supabase && user) {
      const result = await supabase.from("projects").insert({
        title: project.title, description: project.description, category: project.category,
        skills: project.skills, technologies: project.tools, owner_id: user.id,
        collaboration_type: project.kind === "Ищу напарника" ? "partner" : "team",
        image_url: imageUrl || null
      }).select("id").single();
      if (result.error) return notice(result.error.message);
      project.id = result.data.id;
    }
    setModal(null);
    setImagePreview("");
    notice(t.published);
  }

  async function auth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return notice("Supabase is not connected");
    const form = new FormData(event.currentTarget);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result = action === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return notice(result.error.message);
    setUser(result.data.user);
    setModal(null);
  }

  async function google() {
    if (!supabase) return notice("Supabase is not connected");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) notice(t.googleHelp);
  }

  async function apply(project: Project) {
    if (!user) {
      notice(t.signInFirst);
      return setModal("auth");
    }
    if (supabase && isDbId(project.id)) {
      const { error } = await supabase.from("applications").insert({ project_id: project.id, applicant_id: user.id, message: "Interested via KLYRO" });
      if (error) return notice(error.code === "23505" ? (lang === "ru" ? "Ты уже откликнулся" : "You already applied") : error.message);
    }
    notice(t.sent);
  }

  return <main className="min-h-screen">
    <div className="mesh noise" />
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      <a href="#" className="flex items-center gap-2.5 font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-lg shadow-lg shadow-violet-700/30">K</span><span className="text-lg">KLYRO</span></a>
      <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">{t.nav.map((label, index) => <a key={label} href={index === 0 ? "#projects" : index === 1 ? "#projects" : "#how"} className="transition hover:text-white">{label}</a>)}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} className="rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5"><Globe2 className="mr-1 inline" size={14} />{lang.toUpperCase()}</button>
        {user ? <button onClick={async () => { await supabase?.auth.signOut(); setUser(null); }} className="hidden rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 sm:block">{t.logout}</button> : <button onClick={() => setModal("auth")} className="rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">{t.login}</button>}
        <button onClick={() => setModal("create")} className="violet-btn rounded-xl px-3.5 py-2.5 text-sm font-semibold"><Plus className="mr-1 inline" size={16}/><span className="hidden sm:inline">{t.create}</span></button>
      </div>
    </nav>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-14 md:px-8 md:pb-32 md:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="glass mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold tracking-[.17em] text-violet-200"><Sparkles size={13}/>{t.eyebrow}</div>
        <h1 className="text-5xl font-bold leading-[1.02] tracking-[-.055em] md:text-7xl">{t.titleA}<br/><span className="gradient-text">{t.titleB}</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">{t.subtitle}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#projects" className="violet-btn rounded-xl px-6 py-3.5 text-sm font-semibold">{t.browse}<ArrowUpRight className="ml-2 inline" size={16}/></a>
          <button onClick={() => setModal("create")} className="rounded-xl border border-white/10 bg-white/[.035] px-6 py-3.5 text-sm font-semibold transition hover:bg-white/[.07]"><Plus className="mr-2 inline" size={16}/>{t.create}</button>
        </div>
      </div>
      <div className="glass mx-auto mt-14 grid max-w-4xl grid-cols-3 overflow-hidden rounded-2xl text-center">
        {[[projects.length, lang === "ru" ? "идей в ленте" : "ideas live"], [saved.length, t.saved.toLowerCase()], ["24/7", lang === "ru" ? "ищем своих" : "finding people"]].map(([value, label]) => <div key={String(label)} className="border-r border-white/[.07] p-4 last:border-0 md:p-5"><strong className="block text-lg md:text-xl">{value}</strong><span className="mt-1 block text-[10px] text-zinc-500 md:text-xs">{label}</span></div>)}
      </div>
    </section>

    <section id="projects" className="relative z-10 mx-auto max-w-7xl px-5 pb-24 md:px-8">
      <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-violet-300">{t.projects}</p><h2 className="text-3xl font-bold tracking-tight md:text-4xl">{lang === "ru" ? "Выбери, что хочешь" : "Pick what you want to"} <span className="gradient-text">{lang === "ru" ? "запустить." : "ship."}</span></h2><p className="mt-3 max-w-xl text-sm text-zinc-500">{t.fresh}</p></div>
        <button onClick={() => setModal("create")} className="violet-btn self-start rounded-xl px-4 py-3 text-sm font-semibold md:self-auto"><Plus className="mr-2 inline" size={16}/>{t.create}</button>
      </div>
      <div className="glass mb-7 rounded-2xl p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/><input className="field py-3 pl-11 pr-4 text-sm" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search}/></label>
          <div className="flex gap-2 overflow-x-auto">{[["all", t.all], ["partner", t.partner], ["team", t.team]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-medium transition ${filter === value ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>{label}</button>)}</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map(project => <article key={project.id} className="k-card">
          {project.imageUrl ? <img src={project.imageUrl} alt="" className="relative z-10 h-44 w-full object-cover"/> : <div className="relative z-10 flex h-28 items-center justify-between px-5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/10 text-2xl text-violet-200">{project.emoji}</span><span className="chip px-3 py-1.5 text-[11px]">{project.category}</span></div>}
          <div className="relative z-10 p-5">{project.imageUrl && <div className="mb-3 flex justify-between"><span className="chip px-3 py-1.5 text-[11px]">{project.category}</span><button onClick={() => toggleSaved(project.id)} aria-label={t.saved} className="text-zinc-400 transition hover:text-violet-200">{saved.includes(project.id) ? <BookmarkCheck size={20} className="text-violet-300"/> : <Bookmark size={20}/>}</button></div>}
            {!project.imageUrl && <button onClick={() => toggleSaved(project.id)} aria-label={t.saved} className="absolute right-5 top-[-65px] text-zinc-400 transition hover:text-violet-200">{saved.includes(project.id) ? <BookmarkCheck size={20} className="text-violet-300"/> : <Bookmark size={20}/>}</button>}
            <h3 className="text-lg font-bold tracking-tight">{project.title}</h3><p className="mt-2 min-h-[3rem] text-sm leading-6 text-zinc-400">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{project.skills.slice(0, 3).map(skill => <span key={skill} className="chip px-2.5 py-1 text-[11px]">{skill}</span>)}</div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[.08] pt-4"><div className="text-xs text-zinc-500"><span className="text-zinc-300">{project.owner}</span><span className="mx-1.5">·</span><Users className="mr-1 inline" size={13}/>{project.members} {t.members}</div><button onClick={() => apply(project)} className="rounded-lg bg-white/8 px-3 py-2 text-xs font-semibold transition hover:bg-violet-500">{t.join}<ArrowUpRight className="ml-1 inline" size={13}/></button></div>
          </div>
        </article>)}
      </div>
      {!shown.length && <div className="glass rounded-2xl py-16 text-center text-sm text-zinc-500">{t.noResults}</div>}
    </section>

    <section id="how" className="relative z-10 mx-auto max-w-7xl px-5 pb-24 md:px-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-violet-300">{t.how}</p><h2 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">{t.howTitle}</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{t.steps.map(([title, body], index) => <div key={title} className="k-card p-6"><span className="mb-7 grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-sm font-bold text-violet-200">0{index + 1}</span><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p></div>)}</div>
    </section>

    <section className="relative z-10 mx-5 mb-16 overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-600/25 via-[#181522] to-emerald-400/10 px-6 py-12 text-center md:mx-auto md:max-w-7xl md:px-12 md:py-16">
      <Zap className="mx-auto mb-5 text-violet-200" size={28}/><h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t.cta}</h2><p className="mt-3 text-zinc-300/70">{t.ctaSub}</p><button onClick={() => setModal("create")} className="mt-7 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-zinc-950">{t.start}<ArrowUpRight className="ml-2 inline" size={16}/></button>
    </section>

    <footer className="relative z-10 flex flex-col gap-2 border-t border-white/[.07] px-5 py-7 text-center text-xs text-zinc-600 md:flex-row md:justify-between md:px-8"><span>© 2026 KLYRO</span><span>Find the people who make you want to build.</span></footer>

    {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-violet-300/30 bg-[#211f2b] px-5 py-3 text-sm shadow-2xl">{toast}</div>}
    {modal && <div onClick={() => setModal(null)} className="fixed inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div onClick={e => e.stopPropagation()} className="glass w-full max-w-lg rounded-2xl p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-xl font-bold">{modal === "create" ? t.createTitle : t.auth}</h3><p className="mt-1 text-xs text-zinc-500">{modal === "create" ? (lang === "ru" ? "Собери людей вокруг идеи." : "Bring the right people around an idea.") : (lang === "ru" ? "Сохрани проекты и откликайся." : "Save projects and apply.")}</p></div><button onClick={() => setModal(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"><X size={20}/></button></div>
      {modal === "create" ? <form onSubmit={publish} className="space-y-3"><input required name="title" placeholder={t.projectName} className="field p-3"/><textarea required name="description" rows={3} placeholder={t.description} className="field p-3"/><div className="grid gap-3 sm:grid-cols-2"><input required name="category" placeholder={t.category} className="field p-3"/><select name="kind" className="field p-3"><option value="Ищу команду">{t.team}</option><option value="Ищу напарника">{t.partner}</option></select></div><input name="skills" placeholder={t.skills} className="field p-3"/><input name="tools" placeholder={t.tools} className="field p-3"/><label className="block cursor-pointer rounded-xl border border-dashed border-white/15 p-3 text-sm text-zinc-400">{t.image}<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full text-xs" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 4 * 1024 * 1024) { e.target.value = ""; return notice("Image maximum size is 4 MB"); } const reader = new FileReader(); reader.onload = () => setImagePreview(String(reader.result)); reader.readAsDataURL(file); }}/>{imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 h-32 w-full rounded-lg object-cover"/>}</label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal(null)} className="rounded-xl px-4 py-3 text-sm text-zinc-400">{t.back}</button><button className="violet-btn rounded-xl px-5 py-3 text-sm font-bold">{t.publish}</button></div></form> :
      <form onSubmit={auth} className="space-y-3"><button type="button" onClick={google} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-semibold transition hover:bg-white/[.08]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-zinc-900">G</span>{t.google}</button><div className="flex items-center gap-3 py-1 text-[11px] text-zinc-600"><span className="h-px flex-1 bg-white/10"/>{lang === "ru" ? "или по почте" : "or with email"}<span className="h-px flex-1 bg-white/10"/></div><input required type="email" name="email" placeholder={t.email} className="field p-3"/><input required type="password" minLength={6} name="password" placeholder={t.password} className="field p-3"/><div className="grid grid-cols-2 gap-2 pt-1"><button name="action" value="signin" className="violet-btn rounded-xl px-4 py-3 text-sm font-bold">{t.signIn}</button><button name="action" value="signup" className="rounded-xl border border-white/10 px-4 py-3 text-sm transition hover:bg-white/5">{t.signUp}</button></div></form>}
    </div></div>}
  </main>;
}