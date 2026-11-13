# Hamza Mega Store — Website Project

This folder contains the complete code for the **Hamza Mega Store** online
shop. It is a Next.js website with a product catalogue, shopping cart, Cash
on Delivery checkout, order tracking, and an **Admin Panel** where the store
owner can add/edit/delete products, change prices and change store settings
— no coding needed.

Follow the steps below to put this website live on the internet with Vercel
(free). You do **not** need to install anything on your computer.

---

## PART 1 — Steps in English

### Step 0 — Extract the ZIP file

If you received this project as a ZIP file, **extract (unzip) it first** on
your computer. You should see a folder named `hamza-mega-store-vercel`
containing files like `package.json` and folders named `app`,
`components`, `lib`.

### Step 1 — Put the code on GitHub

1. Go to [github.com](https://github.com) and sign in (or create a free
   account if you don't have one).
2. Click the **+** button (top right) → **New repository**.
3. Repository name: `hamza-mega-store` (or any name you like).
4. Keep it **Public**, then click **Create repository**.
5. On the new repository page, click **"uploading an existing file"**.
6. Open the `hamza-mega-store-vercel` folder on your computer, select **ALL**
   files and folders inside it, and drag them into the GitHub upload area.
   (If your computer hides files starting with a dot — like `.gitignore` —
   don't worry, those are optional.)
7. Click **Commit changes** and wait until the upload finishes. You should
   now see the `app`, `components` and `lib` folders on GitHub.

### Step 2 — Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with the Vercel
   account you already created.
2. Click **Add New** → **Project**.
3. Under **Import Git Repository**, find `hamza-mega-store` and click
   **Import**. (If Vercel asks to connect GitHub, allow it and select the
   repository.)
4. On the setup screen, leave everything as it is and click **Deploy**.
5. Wait 1–2 minutes. When it says **Congratulations**, your website is live!
   Vercel will show you a link like
   `https://hamza-mega-store-xxxx.vercel.app` — **save this link**, you need it
   in the next steps.

### Step 3 — Create the database (Postgres)

The shop needs a database to store products and orders:

1. In the Vercel dashboard, open your project.
2. Click the **Storage** tab at the top.
3. Click **Create Database** → choose **Postgres** → click **Continue**.
4. Give it any name (e.g. `hamza-store-db`) and click **Create**.
5. Vercel will ask which project to connect it to — select
   `hamza-mega-store` and click **Connect**. (This automatically adds the
   `POSTGRES_URL` setting — you don't have to type anything.)
6. After connecting, go to the **Deployments** tab, open the latest
   deployment, click the **⋯ (three dots)** menu → **Redeploy**. This makes
   sure the live website can see the new database.

### Step 4 — Load the sample products (one time only)

1. Open this address in your browser (replace with your own Vercel link):

   `https://hamza-mega-store-xxxx.vercel.app/api/seed`

2. You should see a message like `"ok": true` and
   `"products_seeded": 31`. That means the tables were created and 31 sample
   products were loaded.
3. Now open your website link — the shop should show all the products.
4. This step is safe to repeat: if products already exist, nothing is
   changed.

### Step 5 — Log in to the Admin Panel and change the password

1. Open `https://hamza-mega-store-xxxx.vercel.app/admin`
2. Password: `hamza123`
3. Go to **Settings** → **Change Admin Password** and set your own password
   right away. Keep it safe — this password controls your whole store.
4. In the Admin Panel you can:
   - **Products** — add a new product, edit price/photo/stock, or delete a
     product. (To add a product photo, use the **Upload Main Photo**
     button — the photo is compressed automatically. You can also add up
     to 4 extra photos, shown as thumbnails on the product page, or paste
     an image link instead.) Products can also have **variants** — sizes,
     colours or weights with their own price and stock (see "Product
     variants" below).
   - **Orders** — see customer orders and change their status
     (Pending → Confirmed → Shipped → Delivered).
   - **Settings** — change phone, WhatsApp, email, address, delivery
     charges, free-delivery limit and the announcement bar text.

### Step 6 — Connect your own domain (later, when ready)

Your domain is at Hostinger. To use it for this website:

1. In the Vercel dashboard, open your project → **Settings** → **Domains**.
2. Type your domain name (e.g. `hamzamegastore.com`) and click **Add**.
3. Vercel will show you DNS records to add. Log in to Hostinger → your
   domain's **DNS settings** → add the records exactly as Vercel shows.
4. Wait a few minutes to a few hours — your website will then open on your
   own domain.

### Updating the website later

- **Products, prices, settings:** use the Admin Panel (`/admin`) — no code.
- **Design or code changes:** change the files on GitHub (or ask your
  developer). Vercel automatically re-deploys the website whenever the
  GitHub repository changes.

### Updating your live site with a new version (e.g. v3)

When you receive an updated project ZIP from your developer:

1. **Extract** the new ZIP on your computer.
2. Go to your GitHub repository (`hamza-mega-store`) → **Add file** →
   **Upload files**.
3. Select **ALL** files and folders from the new project folder and drag
   them in — this **overwrites** the old files with the new version.
   Click **Commit changes**.
4. Vercel will **automatically re-deploy** the website (1–2 minutes).
   No new project is needed.
5. When the deployment finishes, open your `/api/seed` link once
   (e.g. `https://www.hamzamegastore.com/api/seed`). This creates the new
   database tables/columns for the update. **Your existing products and
   orders are kept — nothing is deleted or duplicated.**
6. Open your website and check that everything still works.

### Product variants (sizes, colours, weights)

A product can now have **options** — for example shoe sizes (UK 7, 8, 9,
10), colours (Red, Blue, Black) or weights (500g, 1kg). Each option has
its own price and stock, and customers choose one on the product page.

- In the Admin Panel, open a product and set the **Variant Option Name**
  (e.g. `Size`, `Color` or `Weight`), then add one row per option with
  its price and stock.
- Leave the option name **empty** for a normal product with one price.
- Orders show the chosen option next to the product name (e.g.
  "Men's Running Shoes — UK 9"), in the Admin Orders page and on the
  customer's My Orders page.

### Product photos — upload and gallery (v3)

Each product can have a **main photo plus up to 4 extra photos**:

- In the Admin Panel, open a product and use the **Upload Main Photo**
  button to pick a photo from your phone or computer. The photo is
  compressed in the browser first, so even large phone photos upload
  quickly.
- Use the **＋** button under **Extra Photos** to add more photos — they
  appear as thumbnails on the product page, and customers tap them to
  view. Tap the **✕** on a photo to remove it.
- You can still paste an image link instead of uploading, using the
  "…or paste an image link" box.
- Uploaded photos are stored in the shop's database — no extra service
  or setup is needed. After updating to v3, open your `/api/seed` link
  once (as in the update steps above) so the database adds the gallery
  column. Your existing products, photos and orders are kept.

### Troubleshooting

- **Website shows "No products loaded yet":** you skipped Step 4 — open the
  `/api/seed` link once.
- **`/api/seed` says POSTGRES_URL is not set:** the database is not
  connected — repeat Step 3 and Redeploy.
- **Admin login says "Wrong password":** the password was changed in
  Settings. If you forgot it, open `/api/seed` again — it does NOT reset
  the password (it never overwrites settings). Ask your developer to reset
  it in the Vercel Postgres data browser.
- **Vercel build fails:** make sure you uploaded ALL files from the project
  folder, including `package.json`, `next.config.mjs` and the `app` folder.

---

## PART 2 — Steps in Roman Urdu

### Step 0 — ZIP file ko pehle extract karein

Agar project ZIP file mein mila hai to pehle usay **extract (unzip)** karein.
Aapko `hamza-mega-store-vercel` naam ka folder nazar aayega jis mein
`package.json` jaisi files aur `app`, `components`, `lib` folders honge.

### Step 1 — Code GitHub par daalein

1. [github.com](https://github.com) kholein aur sign in karein (account nahi
   hai to free bana lein).
2. Upar right side **+** button → **New repository**.
3. Naam likhein: `hamza-mega-store`. **Public** rakhein, phir
   **Create repository** dabayein.
4. Naye repository page par **"uploading an existing file"** par click karein.
5. Apne computer par `hamza-mega-store-vercel` folder kholein, andar ki
   **SAARI files aur folders** select karke GitHub wali jagah par drag kar
   dein. (Dot (.) se shuru hone wali files nazar na aayein to koi baat nahi,
   woh zaroori nahi hain.)
6. **Commit changes** dabayein aur upload mukammal hone ka intezar karein.
   Ab GitHub par `app`, `components` aur `lib` folders nazar aane chahiye.

### Step 2 — Vercel par project import karein

1. [vercel.com](https://vercel.com) kholein aur apne Vercel account se sign
   in karein (jo aap pehle bana chuke hain).
2. **Add New** → **Project** dabayein.
3. **Import Git Repository** mein `hamza-mega-store` dhoondh kar **Import**
   dabayein. (Agar Vercel GitHub connect karne ko kahe to allow kar dein.)
4. Setup screen par kuch bhi change kiye baghair **Deploy** dabayein.
5. 1–2 minute intezar karein. **Congratulations** likha aayega — website
   live ho gayi! Vercel aapko link dega, jaisa
   `https://hamza-mega-store-xxxx.vercel.app` — **ye link save kar lein**,
   agle steps mein chahiye.

### Step 3 — Database banayein (Postgres)

Dukaan ko products aur orders save karne ke liye database chahiye:

1. Vercel dashboard mein apna project kholein.
2. Upar **Storage** tab par click karein.
3. **Create Database** → **Postgres** select karein → **Continue**.
4. Koi bhi naam dein (jaisa `hamza-store-db`) aur **Create** dabayein.
5. Vercel poochega ke kis project se connect karna hai —
   `hamza-mega-store` select karke **Connect** dabayein. (Is se
   `POSTGRES_URL` khud lag jayega — aapko kuch type nahi karna.)
6. Phir **Deployments** tab mein ja kar latest deployment kholein, **⋯
   (teen dots)** menu → **Redeploy** dabayein, taake live website naye
   database ko pehchan le.

### Step 4 — Sample products load karein (sirf aik dafa)

1. Browser mein ye address kholein (apna Vercel link lagayein):

   `https://hamza-mega-store-xxxx.vercel.app/api/seed`

2. Aapko `"ok": true` aur `"products_seeded": 31` jaisa message nazar
   aayega — matlab tables ban gayi aur 31 sample products load ho gaye.
3. Ab apni website kholein — saare products nazar aane chahiye.
4. Ye step dobara bhi kar sakte hain: agar products pehle se hain to kuch
   change nahi hoga.

### Step 5 — Admin Panel mein login karke password badlein

1. `https://hamza-mega-store-xxxx.vercel.app/admin` kholein.
2. Password: `hamza123`
3. **Settings** → **Change Admin Password** mein ja kar foran apna password
   laga lein. Ye password sambhal kar rakhein — is se poori dukaan control
   hoti hai.
4. Admin Panel mein aap ye sab kar sakte hain:
   - **Products** — naya product add karein, price/photo/stock badlein ya
     product delete karein. (Photo ke liye **Upload Main Photo** wala
     button istemal karein — photo khud compress ho jayegi. 4 extra photos
     bhi add kar sakte hain, jo product page par thumbnails mein nazar
     aayengi; ya image ka link bhi paste kar sakte hain.) Products ke
     **variants** bhi ho sakte hain —
     size, colour ya weight, har aik ki apni price aur stock (neeche
     "Product variants" dekhein).
   - **Orders** — customers ke orders dekhein aur status badlein
     (Pending → Confirmed → Shipped → Delivered).
   - **Settings** — phone, WhatsApp, email, address, delivery charges,
     free-delivery limit aur upar wali patti ka text badlein.

### Step 6 — Apna domain connect karein (jab tayyar hon)

Aapka domain Hostinger par hai. Usay is website se jorne ke liye:

1. Vercel dashboard → apna project → **Settings** → **Domains**.
2. Apna domain naam likhein (jaisa `hamzamegastore.com`) aur **Add**
   dabayein.
3. Vercel aapko DNS records dikhayega. Hostinger mein login karke apne
   domain ki **DNS settings** mein wohi records add kar dein.
4. Kuch minute ya ghanton mein website aapke apne domain par khulne lagay
   gi.

### Baad mein website update karna

- **Products, prices, settings:** Admin Panel (`/admin`) se karein — code ki
  zaroorat nahi.
- **Design ya code mein tabdeeli:** GitHub par files badlein (ya developer
  se karwayein). GitHub par tabdeeli hote hi Vercel website khud dobara
  deploy kar dega.

### Live site ko naye version se update karna (jaisa v3)

Jab developer se updated project ZIP mile:

1. Nayi ZIP ko apne computer par **extract** karein.
2. Apne GitHub repository (`hamza-mega-store`) mein jayein → **Add file** →
   **Upload files**.
3. Naye project folder ki **SAARI** files aur folders select karke drag kar
   dein — is se purani files **nayi files se badal jayengi**.
   **Commit changes** dabayein.
4. Vercel website ko **khud dobara deploy** kar dega (1–2 minute).
   Naya project banane ki zaroorat nahi.
5. Deployment mukammal ho jaye to apna `/api/seed` wala link aik dafa
   kholein (jaisa `https://www.hamzamegastore.com/api/seed`). Is se update
   ke liye naye database tables/columns ban jayenge. **Aapke purane
   products aur orders mehfooz rahenge — kuch delete ya double nahi hoga.**
6. Website khol kar check kar lein ke sab theek chal raha hai.

### Product variants (size, colour, weight)

Ab aik product ke **options** bhi ho sakte hain — jaisa jooton ke sizes
(UK 7, 8, 9, 10), colours (Red, Blue, Black) ya weight (500g, 1kg). Har
option ki apni price aur stock hoti hai, aur customer product page par
aik option select karta hai.

- Admin Panel mein product kholein aur **Variant Option Name** likhein
  (jaisa `Size`, `Color` ya `Weight`), phir har option ke liye aik row
  add karein — us ki price aur stock ke saath.
- Normal product (aik price wala) ke liye option name **khaali** chor dein.
- Orders mein product ke naam ke saath chuna hua option bhi likha aayega
  (jaisa "Men's Running Shoes — UK 9") — Admin Orders page par bhi aur
  customer ke My Orders page par bhi.

### Product photos — upload aur gallery (v3)

Har product ki **aik main photo aur 4 extra photos** tak ho sakti hain:

- Admin Panel mein product kholein aur **Upload Main Photo** wale button
  se apne phone ya computer se photo select karein. Photo browser mein
  pehle compress ho jayegi, is liye bari phone photos bhi jaldi upload
  hongi.
- **Extra Photos** ke neeche **＋** wale button se mazeed photos add
  karein — ye product page par thumbnails mein nazar aayengi, customer
  tap karke dekh sakta hai. Photo hatane ke liye us par **✕** dabayein.
- Upload ke bajaye image ka link bhi paste kar sakte hain ("…or paste an
  image link" wala box).
- Upload ki hui photos dukaan ke database mein save hoti hain — koi alag
  service ya setup nahi chahiye. V3 par update karne ke baad apna
  `/api/seed` wala link aik dafa kholein (upar wale update steps ke
  mutabiq) taake database mein gallery column ban jaye. Aapke purane
  products, photos aur orders mehfooz rahenge.

### Masla ho to

- **Website par "No products loaded yet" likha aaye:** Step 4 reh gaya hai —
  `/api/seed` wala link aik dafa kholein.
- **`/api/seed` par "POSTGRES_URL is not set" aaye:** database connect nahi
  hua — Step 3 dobara karein aur Redeploy dabayein.
- **Admin login par "Wrong password" aaye:** password Settings mein badla
  jaa chuka hai. Agar bhool gaye hain to `/api/seed` dobara kholne se
  password reset NAHI hoga — developer se Vercel Postgres data browser se
  reset karwayein.
- **Vercel par build fail ho jaye:** check karein ke project folder ki SAARI
  files upload hui hain, khaas kar `package.json`, `next.config.mjs` aur
  `app` folder.

---

## Project contents (for developers)

- `app/` — pages (home, category, product, cart, checkout, orders, about,
  blog, reviews, contact, admin) and API routes (`/api/seed`,
  `/api/products`, `/api/orders`, `/api/image`, `/api/admin/*`)
- `components/` — header, footer, product cards, cart drawer, hero carousel,
  checkout/order forms, admin panels
- `lib/` — Postgres helpers (`db.ts`), seed catalogue (`seed-data.ts`),
  admin session helpers (`admin.ts`), product validation
- `package.json`, `tsconfig.json`, `next.config.mjs`, `.env.example`

Tech: Next.js 14 (App Router) + TypeScript + `@vercel/postgres`.
All storefront data (products, settings, delivery charges) is read live from
Postgres — nothing is hardcoded in the frontend.
