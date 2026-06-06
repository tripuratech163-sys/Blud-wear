# 📸 Quick Image Management Guide

## Where to Change Images in BludWear

### 1️⃣ **Navbar Logo** 
**File:** `src/sections/Navbar/index.jsx` (Line 32)

Currently set to:
```
https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg
```

✏️ **How to change:**
- Open the file
- Find the `<img src="..."` tag
- Replace the URL with your logo URL from Supabase

---

### 2️⃣ **Hero Background Image**
**File:** `src/sections/Hero/index.jsx` (Line 5)

Currently uses: `/hero.png` or a Supabase URL

✏️ **How to change:**
- Open the file
- Find `<img src="/hero.png"`
- Replace with new image path

---

### 3️⃣ **Product Images** 
**File:** `src/data/products.js`

Each product has an `image` field:
```javascript
{
  id: "m1",
  name: "Crimson Core Hoodie",
  image: "/hoodie.png",  // ← Change this
}
```

✏️ **How to change:**
- Find the product name
- Update the `image:` value

---

### 4️⃣ **Other Static Images**
Check these files for more images:
- `src/sections/BrandStory/index.jsx`
- `src/sections/PremiumOutfits/index.jsx`
- `src/sections/FeaturedProducts/index.jsx`

---

## 🌐 Your Supabase URLs

**Format:**
```
https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/BUCKET_NAME/filename
```

**Your Project ID:** `pkfdvlpegeasnvtqllkz`

**Your Bucket:** `Bludwear`

**Example:**
```
https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/logo.png
```

---

## 💡 How to Add New Images

### From Supabase Storage:
1. Log in to Supabase Dashboard
2. Go to **Storage** → **Bludwear** bucket
3. Upload your image
4. Click the image → Copy public URL
5. Paste the URL in your code

### From Public Folder:
1. Add image to `public/` folder
2. Reference as: `src="/image-name.png"`

---

## 🔍 Find All Images Quickly

**In VS Code:**
- Press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
- Search for: `.png|.jpg|.jpeg|.webp`
- This shows all images in your project

---

## ❓ Common Issues

| Problem | Solution |
|---------|----------|
| Image not showing | Check URL is correct, bucket is PUBLIC in Supabase |
| Broken images | Verify file exists in Supabase, check file name spelling |
| Want to batch update | Use Find & Replace (Ctrl+H) in VS Code |

---

## 📚 For More Details

See: [IMAGE_MANAGEMENT_GUIDE.md](IMAGE_MANAGEMENT_GUIDE.md)

