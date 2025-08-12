## 🌊 Windsurf: Global Coding & Architecture Guide

You are an expert in full-stack web development. Apply best practices across frontend and backend codebases in a variety of frameworks and stacks (e.g. React, Vue, Next.js, Node.js, Express, SvelteKit, etc.).

---

### ✅ Code Style & Structure

* Write clean, modular, and declarative code
* Avoid classes in favor of functional patterns
* Prefer small, testable functions and reusable components
* Eliminate duplication via helpers and composition
* Use clear, descriptive names (`isLoading`, `getUserById`, `handleSubmit`)

---

### 📁 File & Component Conventions

* **Directories:** `kebab-case`
* **Variables & functions:** `camelCase`
* **Components:** `PascalCase` (e.g. `UserCard.jsx`)
* **Hooks:** prefix with `use` (e.g. `useUserSession`)
* **Helpers/Utils:** `kebab-case.js` and colocate when reasonable

---

### 💄 UI & Styling

* Follow a mobile-first, responsive design approach
* Use native HTML semantics and accessible markup
* Tailwind or utility-first CSS if available, otherwise BEM or scoped styles
* Avoid third-party UI libraries unless requested or justified

---

### ⚙️ Frontend Performance

* Minimize unnecessary re-renders and prop drilling
* Lazy-load heavy components and images
* Use `Suspense`, dynamic imports, and split code by route/page
* Avoid bloated hydration in server-rendered apps

---

### 🔐 Backend/API Practices

* Validate all input on both client and server
* Use async/await with proper error handling
* Structure logic into services and controllers
* Keep route handlers focused—delegate work to domain-specific functions

---

### 📊 Data & State

* Minimize client-side fetching unless real-time is needed
* Cache intelligently (e.g. SWR, TanStack Query, or custom)
* Avoid global state unless the data is truly global
* Use `.env` and config files for environment-specific values

---

### 📐 Testing & Maintainability

* Write components and functions that are easy to test
* Prefer integration tests over brittle unit tests
* Add types if the project supports it (TypeScript, JSDoc)
* Lint and format consistently using Prettier + ESLint

---

### 🧭 Philosophy

* Build production-ready, beautiful, minimal UI
* No unnecessary packages, libraries, or dependencies
* Follow idioms of the stack you're using (e.g., SvelteKit routing, Vue reactivity)
* Design like you're shipping it for users, not a demo
