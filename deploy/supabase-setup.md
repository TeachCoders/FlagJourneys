# Supabase Setup (free — ₹0)

Sab kuch free tier ke andar hai. Order se karo:

## 1. Account + Project
1. `https://supabase.com` → Sign up (email ya Google)
2. **Create a new project** (`flagjourneys`), region **Mumbai/South Asia (ap-south-1)**
3. **Database password** → "Generate a password" → copy → SAVE (notes/WhatsApp-to-self)
4. Security toggles jo default hai chhodo (hamare connection par asar nahi)
5. Project banne ka wait karo (~2-3 min)

## 2. Connection string (DATABASE_URL)
1. Dashboard → top-right **"Connect"** → tab **"Direct"** → **"Connection string"** → **URI**
2. Usme apna password daalo (special char ho to encode):
   - `@` → `%40`,  `:` → `%3A`,  `/` → `%2F`,  `#` → `%23`
3. End me **`?sslmode=require`** add hai/kar do
4. Final example:
   ```
   postgresql://postgres.khgopfgebkkdlnwwoanx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
5. Is URL ko `Backend/.env` ki **`DATABASE_URL`** me daalo

## 3. Storage bucket (images ke liye)
Humara upload code **`public`** bucket use karta hai.

1. Left sidebar → **Storage** → **New bucket**
2. Naam: **`public`**  |  Public bucket ✅  (sab images public URL se khulegi)
   - Suppa Supabase koi default `public` bucket bana deta hai — wo bhi chalega.
3. (Agar pehle se hai → chhodo)

## 4. API keys (service_role)
1. Dashboard → **Project Settings** (gear) → **API** (ya "API Keys")
2. **`Project URL`** → copy → `Backend/.env` ki **`SUPABASE_URL`**
3. **`service_role`** key → copy & save → `Backend/.env` ki **`SUPABASE_SERVICE_ROLE_KEY`**
   ⚠️ YEH SECRET HAI — sirf backend me rakho, kahin frontend me nahi. Leak ho to Supabase se zara sa roko.
4. `Backend/.env` me `STORAGE_BACKEND=supabase` set karo

## 5. Verify (jab backend chal raha ho)
```bash
curl http://localhost:5000/health
# → {"db":"up","sessionStore":"up",...}
```

## Free limits (yaad rakho)
| Cheez | Free |
|---|---|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB/mo |

Ab tumhare paas hai: **cloud DB + cloud images** — VPS sirf app chalata hai. 👍