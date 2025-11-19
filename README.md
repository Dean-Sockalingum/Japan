# Japan 2025 Holiday Memories 🇯🇵

> An interactive web application to capture, plan, and preserve your unforgettable 2025 Japan travel memories with photos, itineraries, quizzes, and local storage—no frameworks required!

![Japan Keepsakes](https://img.shields.io/badge/Japan-2025-red?style=for-the-badge&logo=japan)
![Status](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge)

**For Copilot and contributor coding principles**, see [.github/COPILOT_INSTRUCTIONS.md](./.github/COPILOT_INSTRUCTIONS.md)

---

## 📑 Table of Contents

- [🌸 Overview](#-overview)
- [✨ Key Features](#-key-features)
  - [📸 Memory Capture](#-memory-capture)
  - [🗺️ Travel Companion](#️-travel-companion)
  - [🎯 Interactive Features](#-interactive-features)
  - [🎵 Ambiance](#-ambiance)
  - [🤯 Weird & Interesting Facts](#-weird--interesting-facts)
- [🚀 Getting Started](#-getting-started)
- [📸 Screenshots](#-screenshots)
- [🌐 Deploying to Netlify](#-deploying-to-netlify)
  - [Basic Deployment](#basic-deployment)
  - [Advanced Deployment](#advanced-deployment)
- [📱 Usage](#-usage)
- [🎨 Features](#-features)
- [🛠️ Technical Details](#️-technical-details)
- [☁️ Cloud Photo Backup (Supabase)](#️-cloud-photo-backup-supabase)
- [🌟 Highlights](#-highlights)
- [📦 File Structure](#-file-structure)
- [🎯 Use Cases](#-use-cases)
- [💡 Tips](#-tips)
- [🌐 Browser Support](#-browser-support)
- [🤝 Contributing](#-contributing)
- [💬 Feedback & Issues](#-feedback--issues)
- [📝 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌸 Overview

This comprehensive web application serves as your personal travel companion and digital scrapbook for documenting unforgettable moments in Japan. Capture daily photos and memories, plan routes with fascinating facts, take quizzes about Japanese culture, and create a complete digital keepsake of your adventure—all stored locally in your browser with optional cloud backup.

## ✨ Key Features

### 📸 Memory Capture

- Upload photos with drag & drop support
- Write detailed memory entries with rich descriptions
- Categorize by type (Best, Funny, Food, Culture, Adventure)
- All data saved locally in your browser with no server required

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

Learn amazing trivia about Japan's most iconic locations:

- **Shibuya Crossing**: Up to 3,000 people cross at once during peak times!
- **Fushimi Inari**: Features over 10,000 vibrant torii gates
- **Mount Fuji**: Visible only about 80 days per year due to weather
- **Bamboo Grove**: Officially designated as a sound preservation area
- **Tsukiji Market**: Record-breaking $3.1M tuna sale
- And much more throughout the app!

## 🚀 Getting Started

1. **Open the webpage**: Simply open `index.html` in your web browser (no installation required!)
2. **Start capturing**: Upload photos and write your first memory
3. **Explore**: Check out routes, take quizzes, and discover fascinating facts
4. **Plan ahead**: Browse hotels, restaurants, and attractions with QR codes
5. **Enjoy**: All your data saves automatically in your browser's local storage!

## 🌐 Deploying to Netlify

Want to make the experience available for friends and travel companions? Netlify can host the site for free in just a few minutes.

### Basic Deployment

Follow these simple steps to get your site online:

1. **Fork this repository**: Click "Fork" on GitHub to create your own copy
2. **Sign in to Netlify**: Go to [Netlify](https://app.netlify.com/) and sign in (it's free!)
3. **Import your project**: Choose **Add new site → Import an existing project**
4. **Connect your repository**: Select your forked repository from GitHub (or GitLab/Bitbucket)
5. **Configure settings**:
   - Build command: *leave empty*
   - Publish directory: `.` (the root folder)
6. **Deploy!** Netlify will build and assign a live URL like `https://your-site-name.netlify.app`

The repository includes a `netlify.toml` file with sensible defaults (including a catch-all redirect) so deep links continue to work exactly like they do locally.

### Advanced Deployment

For developers who want more control:

- **Netlify CLI**: Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) for local testing and deployment
  ```bash
  npm install -g netlify-cli
  netlify login
  netlify deploy --prod
  ```
- **Environment Variables**: Configure Supabase cloud backup by setting environment variables in **Site settings → Environment variables** (see [Cloud Photo Backup section](#️-cloud-photo-backup-supabase))
- **Custom Domain**: Add your own domain in Netlify's domain settings
- **Build Hooks**: Set up automatic deployments on git push

## 📱 Usage

### Capturing Memories

1. Navigate to the **Memories** tab
2. Upload photos by clicking the upload area or dragging files
3. Fill in the memory form with title, category, description, and date
4. Click "Save Memory" to store it locally

### Planning Your Trip

1. Visit the **Travel Guide** tab for curated hotels and restaurants
2. Check the **Routes** tab for detailed 1-3 day itineraries with timing
3. Read fascinating facts to prepare for each location
4. Save your favorite places for quick reference
5. Use QR codes for instant access to maps and booking sites

### Testing Knowledge

1. Go to the **Quiz** tab
2. Select a topic (Tokyo, Kyoto, Food, Culture, or General Japan)
3. Answer 5 multiple-choice questions
4. Get instant feedback with educational explanations
5. Track your scores and challenge yourself to improve

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

### Core Technologies
- **Pure HTML/CSS/JavaScript** - No frameworks needed, just modern vanilla web technologies
- **Local Storage API** - Client-side data persistence for offline-friendly experience
- **Responsive Design** - Works seamlessly on mobile and desktop devices

### External APIs & Services
- **Google Charts API** - QR code generation for quick access to maps and websites
- **Google Maps** - Route directions and location mapping
- **Netlify Functions** *(optional)* - Serverless backend for cloud photo uploads
- **Supabase** *(optional)* - Cloud storage backend for photo backups

### Future Enhancements
Consider adding these external services to enhance functionality:
- **Weather API** - Real-time weather information for destinations
- **Translation API** - Multi-language support
- **Geolocation API** - Auto-location tagging for memories

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

## 📸 Screenshots

> 💡 **Tip**: Screenshots help visualize the application's features. See the interactive tabs in action!

### Main Memory Page

Capture your experiences with photos and detailed descriptions. Upload images with drag-and-drop, categorize by type (Best, Funny, Food, Culture, Adventure), and save memories with dates and locations.

*Screenshot placeholder: Memory capture interface with photo upload area and form fields*

### Travel Guide

Discover recommended hotels, restaurants, and attractions with QR codes for quick access. Each recommendation includes ratings, price ranges, and direct booking/map links.

*Screenshot placeholder: Travel guide tab showing curated recommendations with QR codes*

### Route Planning with Facts

Detailed itineraries with weird and interesting facts about each location. Pre-planned 1-3 day routes include time schedules, Google Maps integration, and fascinating trivia.

*Screenshot placeholder: Route planning view with itinerary timeline and location facts*

### Interactive Quiz

Test your knowledge about Japan with fun quizzes covering Tokyo, Kyoto, Food, Culture, and General Japan topics. Get instant feedback and educational explanations for each answer.

*Screenshot placeholder: Quiz interface showing multiple-choice questions and score tracking*

### Highlights Dashboard

View your auto-generated trip summary with timeline views, statistics (total memories, photos, best moments), and daily highlights all in one place.

*Screenshot placeholder: Highlights page showing aggregated trip statistics and timeline*

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
├── script.js                # Core browser logic (obfuscated build)
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

- **Pre-Trip**: Take the quizzes to learn about destinations before you visit
- **Daily**: Upload a photo of the day each evening to track highlights
- **On Location**: Read the fascinating facts before visiting each site
- **Quick Access**: Use QR codes to quickly open maps and websites on your phone
- **Backup**: Export your data regularly as a JSON file for safekeeping
- **Organize**: Use memory categories to easily find specific types of experiences later

## 🌐 Browser Support

Works on all modern browsers:

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're a seasoned developer or just getting started, there are many ways to help improve this project.

### 🌟 How You Can Contribute

- **Suggest New Features**: Have an idea for a new feature? Open an issue with the "enhancement" label
- **Add New Locations**: Know great hotels, restaurants, or attractions in Japan? Submit them via pull request
- **Improve Routes**: Create new itineraries or optimize existing ones
- **Report Bugs**: Found a bug? Let us know by opening an issue
- **Fix Issues**: Check out the [Issues](https://github.com/Dean-Sockalingum/Japan/issues) page and submit a pull request
- **Improve Documentation**: Help make the README, FEATURES.md, or code comments better
- **Add Translations**: Help make the app accessible in other languages

### 📝 Getting Started with Contributions

1. **Fork the repository** and clone it to your local machine
2. **Create a new branch** for your feature: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Test your changes** thoroughly in your browser
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with a clear description of your changes

### 💡 Contribution Guidelines

- Keep changes focused and atomic (one feature/fix per PR)
- Follow the existing code style and formatting
- Test your changes across different browsers
- Update documentation if you're adding new features
- Be respectful and constructive in discussions

For detailed coding principles and Copilot guidance, see [.github/COPILOT_INSTRUCTIONS.md](./.github/COPILOT_INSTRUCTIONS.md)

---

## 💬 Feedback & Issues

We'd love to hear from you! Your feedback helps make this project better for everyone.

### 🐛 Found a Bug?
Open an issue on our [GitHub Issues](https://github.com/Dean-Sockalingum/Japan/issues) page with:
- A clear description of the bug
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

### 💡 Have an Idea?
Share your feature requests and suggestions:
- Check existing issues to avoid duplicates
- Describe your idea clearly
- Explain the problem it solves
- Tag it with the "enhancement" label

### 🗨️ General Feedback
- Questions about usage? Open a discussion or issue
- Want to share your Japan trip? We'd love to see it!
- Suggestions for improvements? All feedback is welcome!

[**→ Visit GitHub Issues**](https://github.com/Dean-Sockalingum/Japan/issues)

---

## 📝 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

- Background images from [Unsplash](https://unsplash.com) - Beautiful Japan photography
- QR codes via [Google Charts API](https://developers.google.com/chart)
- Maps integration via [Google Maps](https://maps.google.com)
- Cloud storage via [Supabase](https://supabase.com) (optional)
- Deployment via [Netlify](https://netlify.com)

---

Made with ❤️ for unforgettable Japan 2025 memories! 🗾✨

**Start your journey today and capture every magical moment!** 🌸🗻⛩️
