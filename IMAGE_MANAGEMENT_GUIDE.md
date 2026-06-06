# 🖼️ BludWear Image Management Guide

## Quick Reference: Where All Images Are Used

| Location | File | Type | How to Change |
|----------|------|------|--------------|
| **Navbar Logo** | `src/sections/Navbar/index.jsx` | Static | Change `logoUrl` in Supabase path |
| **Hero Background** | `src/sections/Hero/index.jsx` | Static | Update `hero.png` in `/public` OR use Supabase URL |
| **Product Images** | `src/data/products.js` | Product | Update `image` field for each product |
| **Brand Story** | `src/sections/BrandStory/index.jsx` | Static | Check and update image URLs |
| **Featured Products** | `src/sections/FeaturedProducts/index.jsx` | Dynamic | Uses product images from database |
| **Premium Outfits** | `src/sections/PremiumOutfits/index.jsx` | Dynamic | Uses product images from database |

---

## Method 1: Using Supabase Storage (RECOMMENDED ✅)

### Step 1: Get Your Supabase URL
Your storage URL format:
```
https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/BUCKET_NAME/filename.jpg
```

Example from your screenshot:
```
https://your-project.supabase.co/storage/v1/object/public/Bludwear/1.jpeg
```

### Step 2: Update Navbar Logo (Your Navbar)
In [src/sections/Navbar/index.jsx](src/sections/Navbar/index.jsx#L28), change:
```jsx
// FROM THIS:
<div className="navbar-logo">
  <Link to="/">BLUDWEAR</Link>
</div>

// TO THIS:
<div className="navbar-logo">
  <Link to="/">
    <img 
      src="https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/Bludwear/logo.png" 
      alt="BludWear" 
      className="logo-img" 
    />
  </Link>
</div>
```

### Step 3: Update Hero Image
In [src/sections/Hero/index.jsx](src/sections/Hero/index.jsx#L5), change:
```jsx
// FROM:
<img src="/hero.png" alt="BludWear Luxury Athlete" className="hero-image" />

// TO:
<img 
  src="https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/Bludwear/hero.png" 
  alt="BludWear Luxury Athlete" 
  className="hero-image" 
/>
```

### Step 4: Update Product Images
Edit [src/data/products.js](src/data/products.js):

```javascript
// BEFORE:
{
  id: "m1",
  name: "Crimson Core Hoodie",
  image: "/hoodie.png",
  // ...
}

// AFTER:
{
  id: "m1",
  name: "Crimson Core Hoodie",
  image: "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/Bludwear/hoodie.png",
  // ...
}
```

---

## Method 2: Using Public Folder (Quick & Easy)

For local development, just add images to `/public` folder:

1. Place image in `public/` (e.g., `public/my-logo.png`)
2. Reference it as: `src="/my-logo.png"`

**When to use:** Local development, simple projects  
**When NOT to use:** Production, large files, easy management

---

## Complete Image Paths in Your App

### Static Images (Hero, Banners, etc.)
Location: [src/sections/](src/sections/)
- Hero: [src/sections/Hero/index.jsx](src/sections/Hero/index.jsx#L5)
- BrandStory: [src/sections/BrandStory/index.jsx](src/sections/BrandStory/index.jsx)
- MarqueeBanner: [src/sections/MarqueeBanner/index.jsx](src/sections/MarqueeBanner/index.jsx)
- Newsletter: [src/sections/NewsletterSection/index.jsx](src/sections/NewsletterSection/index.jsx)

### Product Images
Location: [src/data/products.js](src/data/products.js)
- Search for `image:` field
- Each product has an image property

### UI Components
Location: [src/sections/Navbar/index.jsx](src/sections/Navbar/index.jsx)
- Logo image location (line 28-30)

---

## How to Find & Replace All Images

### 1️⃣ Find where images are used:
```bash
# Search in VS Code
Ctrl+Shift+F  (or Cmd+Shift+F on Mac)

# Search for image extensions:
\.png|\.jpg|\.jpeg|\.webp

# This shows ALL image references in your code
```

### 2️⃣ Replace patterns:

**If changing from `/public/old.png` to Supabase:**
- Search: `/old\.png`
- Replace: `https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/Bludwear/old.png`

**If just renaming a file in `/public`:**
- Search: `/old\.png`
- Replace: `/new.png`

### 3️⃣ Bulk update in code:
Use VS Code "Replace All" (Ctrl+Alt+Enter):
1. Open Find & Replace (Ctrl+H)
2. Enter search pattern
3. Enter replacement pattern
4. Click "Replace All"

---

## Common Tasks

### 🎯 Add Company Logo to Navbar
**File:** [src/sections/Navbar/index.jsx](src/sections/Navbar/index.jsx#L28)  
**Steps:**
1. Upload logo to Supabase (Bludwear bucket)
2. Copy the public URL from Supabase
3. Update line 28-30 with the image tag and URL

### 🎯 Change Hero Background Image
**File:** [src/sections/Hero/index.jsx](src/sections/Hero/index.jsx#L5)  
**Simply update the `src` URL**

### 🎯 Update All Product Images
**File:** [src/data/products.js](src/data/products.js)  
**Steps:**
1. Open the file
2. Find the product you want to update
3. Change the `image` property value
4. Save the file

---

## Your Supabase URL Format

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.  
Find it here: **Supabase Dashboard → Settings → Project URL**

Example:
```
https://pkfdvpegasrnvfqllz.supabase.co/storage/v1/object/public/Bludwear/logo.png
                ↑
            Your Project ID
```

---

## Pro Tips ✨

1. **Organize by type:** Create subfolders in Supabase
   - `Bludwear/logos/`
   - `Bludwear/heroes/`
   - `Bludwear/products/`

2. **Use consistent naming:** `logo.png`, `hero.png`, `product-1.png`

3. **Cache busting:** Add `?v=1` to URL for updates: `.../logo.png?v=1`

4. **Optimize images:** Use `.webp` format for faster loading

5. **Quick find in VS Code:** Ctrl+Shift+F → Type `src="` or `image:` to find all image references

---

## Need Help?

- **Supabase storage not working?** Check if bucket is set to **PUBLIC** in Supabase dashboard
- **Images not loading?** Verify URL is correct in Supabase Storage → check if file exists
- **Want to use URLs everywhere?** Create a constant file `src/lib/imageUrls.js` with all URLs

