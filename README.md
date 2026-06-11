# Ellie & Grace's Rainbow Loom Shop 🌈

A cute one-page shop where family can order handmade rainbow loom creations.
Orders are cash-only and land on a private, password-protected orders page.

---

## The simple stuff (no tech knowledge needed)

### See your orders

Go to **your-website-address/admin** and type the password.

- **Password:** `ellieandgrace`
- New orders show up under the **New** tab. Tap **Mark done** when you've
  made one, or **Archive** to tuck it away. Nothing is ever truly deleted.
- The yellow card shows how much money the girls have **earned**, and the
  purple card shows how much is **still to make**.

### Change the password

The password lives in a setting called `ADMIN_PASSWORD` on Vercel
(Project → Settings → Environment Variables). Change it there, then redeploy.

### Add the cartoon picture of the girls

1. Put the picture file in the **`public`** folder (name it `hero.png`).
2. In **`components/Hero.tsx`**, change this line near the top:
   ```
   const HERO_IMAGE = "/hero-placeholder.svg";
   ```
   to:
   ```
   const HERO_IMAGE = "/hero.png";
   ```
3. Save and redeploy.

### Change prices or products

Everything the girls sell lives in **`lib/products.ts`** — names, prices,
emojis, and descriptions. Edit, save, redeploy.

---

## Running it on your own computer (optional)

```bash
npm install
npm run dev
```

Then open http://localhost:3000. While developing on your computer, orders are
saved to a local file (`.data/orders.json`) so you can test without a database.

---

## How orders are stored in production

When the site is live on Vercel, orders are saved in a database connected to
the project (look for a `DATABASE_URL` setting). The orders table is created
automatically the first time someone places an order — no setup needed.

## Settings used on Vercel

| Setting          | What it's for                                    |
| ---------------- | ------------------------------------------------ |
| `ADMIN_PASSWORD` | The password for the private `/admin` page       |
| `ADMIN_SECRET`   | A long random string that keeps the login secure |
| `DATABASE_URL`   | Added automatically when you connect a database  |
