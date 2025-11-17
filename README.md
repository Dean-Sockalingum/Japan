# Japan 2025 Holiday Memories 🇯🇵

An interactive and dynamic webpage to capture and save keepsakes from your 2025 Japan holiday adventure!

![Japan Keepsakes](https://img.shields.io/badge/Japan-2025-red?style=for-the-badge&logo=japan)
![Status](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge)

## 🌸 Overview

This comprehensive web application serves as your personal travel companion and digital scrapbook for documenting unforgettable moments in Japan. From capturing daily photos and memories to planning routes with weird facts, this tool has everything you need for an amazing trip!

## ✨ Key Features

### 📸 Memory Capture

- Upload photos with drag & drop
- Write detailed memory entries
- Categorize by type (Best, Funny, Food, Culture, Adventure)
- All data saved locally in your browser

### 🗺️ Travel Companion

- **Hotels**: Curated recommendations with QR codes
- **Restaurants**: Must-try dining experiences
- **Attractions**: Top tourist destinations
- **Routes**: Pre-planned 1-3 day itineraries with Google Maps integration

### 🎯 Interactive Features

- **Quizzes**: Test your Japan knowledge (Tokyo, Kyoto, Food, Culture)
- **Photo of the Day**: Showcase your best daily shot
- **Highlights**: Auto-generated trip summary
- **Bloopers Reel**: Share funny travel moments
- **Weird Facts**: Fascinating trivia about each location

### 🎵 Ambiance

- Optional background music player
- Traditional Japanese music
- Volume controls

### 🤯 Weird & Interesting Facts

Learn amazing trivia about:

- Shibuya Crossing (3,000 people at once!)
- Fushimi Inari (10,000+ torii gates)
- Mount Fuji (visible only 80 days/year)
- And much more!

## 🚀 Getting Started

1. **Open the webpage**: Simply open `index.html` in your web browser
2. **Start capturing**: Upload photos and write your first memory
3. **Explore**: Check out routes, take quizzes, and learn facts
4. **Plan**: Browse hotels, restaurants, and attractions
5. **Enjoy**: All your data is saved automatically!

## 🌐 Deploying to Netlify

Want to make the experience available for friends and travel companions? Netlify can host the site for free in just a few minutes.

1. Fork or clone this repository and push it to your own GitHub account (or connect any Git provider Netlify supports).
2. Sign in to [Netlify](https://app.netlify.com/) and choose **Add new site → Import an existing project**.
3. Pick your repository, leave the build command empty, and set the publish directory to `.` (the root folder).
4. Deploy! Netlify will assign a live URL such as `https://your-site-name.netlify.app`.
5. (Optional) Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run `netlify deploy --prod` locally for repeatable releases.

The repository includes a `netlify.toml` file with sensible defaults (including a catch-all redirect) so deep links continue to work exactly like they do locally.

## 📱 Usage

### Capturing Memories

1. Navigate to the **Memories** tab
2. Upload photos by clicking or dragging
3. Fill in the memory form with title, type, description, and date
4. Click "Save Memory"

### Planning Your Trip

1. Visit the **Travel Guide** tab for hotels and restaurants
2. Check the **Routes** tab for detailed itineraries
3. Read weird facts to prepare for each location
4. Save your favorite places

### Testing Knowledge

1. Go to the **Quiz** tab
2. Select a topic (Tokyo, Kyoto, Food, etc.)
3. Answer 5 questions
4. Learn from explanations
5. Track your scores

### Daily Highlights

1. Use **Photo of the Day** to upload your best shot
2. Add memories throughout the day
3. Check **Highlights** to see your auto-generated trip summary

## 🎨 Features

- ✅ Photo uploads with drag & drop
- ✅ Interactive memory forms
- ✅ Local storage persistence
- ✅ Travel guide with QR codes
- ✅ Detailed route itineraries
- ✅ Google Maps integration
- ✅ Interactive quizzes with 25 questions
- ✅ Photo of the day feature
- ✅ Dynamic highlights page
- ✅ Background music player
- ✅ Weird & interesting facts
- ✅ Bloopers reel
- ✅ Facts & trivia sections
- ✅ Archive with filtering
- ✅ Data export capability
- ✅ Responsive design
- ✅ Japan-inspired theme

## 🛠️ Technical Details

- **Pure HTML/CSS/JavaScript** - No frameworks needed
- **Local Storage API** - Data persistence
- **Google Charts API** - QR code generation
- **Google Maps** - Route directions
- **Responsive Design** - Works on mobile and desktop
- **Netlify Functions + Supabase** *(optional)* - Off-browser photo backups

## ☁️ Cloud Photo Backup (Supabase)

Add long-term storage for your photos without changing the on-page workflow.

1. Create a Supabase project (free tier works fine) and enable Storage.
2. Create a bucket (e.g. `photos`) and make it **public** so you can view uploads without signing in.
3. In Netlify, open **Site settings → Environment variables** and add:
   - `SUPABASE_URL` – Project API URL from Supabase settings.
   - `SUPABASE_SECRET_KEY` – Preferred: the new Supabase secret key (format `sb_secret_...`).
   - `SUPABASE_SERVICE_ROLE_KEY` – Legacy JWT key; keep this only while you finish migrating. The function automatically prefers `SUPABASE_SECRET_KEY` when present and falls back to this variable for older projects.
   - `SUPABASE_BUCKET` *(optional)* – Bucket name (defaults to `photos`).
   - `SUPABASE_FOLDER` *(optional)* – Folder inside the bucket (defaults to `uploads`).
   - `SUPABASE_MAX_UPLOAD_BYTES` *(optional)* – Max image size in bytes (defaults to 5 MB).
4. Redeploy the site. Each new upload now syncs to Supabase through the Netlify function at `/.netlify/functions/upload-photo`.

> 🆕 **Supabase API key migration:** Supabase is rolling out publishable/secret keys to replace the older anon/service_role JWTs. Start generating `sb_secret_...` keys now so you can rotate without downtime before legacy keys disappear in late 2026. This project already supports the new key—just drop it into `SUPABASE_SECRET_KEY`.

When cloud sync is active, every photo card shows a status pill:

- **Cloud syncing...** while the upload is in progress.
- **Cloud upload queued** if waiting its turn.
- **Cloud synced** once Supabase returns the permanent URL (click **View** to open).
- **Warning: ...** if an upload fails; press **Retry** to try again.

Uploads still remain in local storage so the experience stays offline-friendly. The Supabase copy simply gives you a durable backup.

### 📊 Cloud Sync Status Panel

- A new "Cloud backup" panel now sits directly under the Memories photo uploader.
- It surfaces total uploads, pending queue length, last sync time, recent error (if any), and rolling average latency so you can spot stalls immediately.
- The panel is accessible (ARIA live region) and reacts in real time thanks to `cloud-sync.js`, which instruments calls to `/.netlify/functions/upload-photo` and caches state in `localStorage` for quick reloads.
- Badge states:
   - **Idle** – No uploads yet.
   - **Syncing** – One or more uploads currently in-flight.
   - **Backed up** – Latest Supabase call succeeded.
   - **Needs attention** – The last attempt failed; hover to read the error and press "Retry" on the photo card.

### �️ Troubleshooting Supabase Uploads

1. **Confirm Netlify env vars** – In Site settings → Environment variables ensure `SUPABASE_URL` matches your project URL and `SUPABASE_SECRET_KEY` contains the full secret (either the new `sb_secret_...` string or the legacy service-role JWT). Paste without spaces or quotes.
2. **Look for helpful errors** – The Netlify function now refuses to execute when the key is malformed and returns:

    ```json
    {
       "message": "Supabase service role key is malformed. Please copy the entire key from the Supabase dashboard without spaces.",
       "hint": "Service role keys are long JWT strings with two dots (\".\")."
    }
    ```

    If you see `Invalid Compact JWS` in the response body, the stored key is truncated or corrupted—rotate it from Supabase → Settings → API.
3. **Run a curl smoke test** – Before trying from the UI, hit the function directly (replace `your-site` with the deployed domain and adjust the hash string to any hex digest you like):

    ```bash
    curl -sS https://your-site.netlify.app/.netlify/functions/upload-photo \ 
       -H "Content-Type: application/json" \ 
       -d '{
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...", 
          "hash": "0123456789abcdef0123456789abcdef", 
          "metadata": {"source": "curl-test"}
       }'
    ```

    A healthy upload returns HTTP 200 with a JSON payload containing `url`, `path`, and `storedAt`. Any `4xx/5xx` body will include `message`, `details`, and `status` to speed up debugging.
4. **Check Supabase Storage** – Open the Storage browser and verify files appear under the configured bucket/folder. Remember to set the bucket to **public** or create a signed URL policy if you want to keep it private.

If you're still blocked, rotate both the secret key and bucket service role, redeploy on Netlify, and retry the curl command. Nine times out of ten this clears lingering JWT issues.

## �📸 Screenshots

### Main Memory Page

Capture your experiences with photos and detailed descriptions.

### Travel Guide

Discover recommended hotels, restaurants, and attractions with QR codes.

### Route Planning with Facts

Detailed itineraries with weird and interesting facts about each location.

### Interactive Quiz

Test your knowledge about Japan with fun quizzes.

## 🌟 Highlights

- **Fun & Engaging**: Emoji-rich interface with smooth animations
- **Educational**: Learn about Japan through facts and quizzes
- **Practical**: Real travel companion with routes and recommendations
- **Personal**: Capture and preserve your unique memories
- **Complete**: Everything you need in one place

## 📦 File Structure

```text
Japan/
├── index.html                # Main HTML structure
├── styles.css                # Complete styling
├── script.js                 # Core browser logic (obfuscated build)
├── cloud-sync.js             # Cloud backup status + fetch instrumentation
├── supabase-upload.js        # Cloud backup helper (runs after script.js)
├── netlify/
│   └── functions/
│       ├── generate-qr.js    # Existing QR generator function
│       └── upload-photo.js   # Supabase uploader (new)
├── README.md                # This file
└── FEATURES.md              # Detailed feature documentation
```

## 🎯 Use Cases

1. **Pre-Trip**: Research routes, hotels, and attractions
2. **During Trip**: Document daily experiences and photos
3. **Learning**: Take quizzes and read facts
4. **Post-Trip**: Review highlights and export memories

## 💡 Tips

- Take the quizzes before your trip to learn about destinations
- Upload a photo of the day each evening
- Read the weird facts before visiting each location
- Use QR codes to quickly access maps and websites
- Export your data as a backup

## 🌐 Browser Support

Works on all modern browsers:

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## 📝 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

- Background images from Unsplash
- QR codes via Google Charts API
- Maps integration via Google Maps

---

Made with ❤️ for unforgettable Japan 2025 memories! 🗾✨

Start your journey today and capture every magical moment! 🌸🗻⛩️
