# GitHub Copilot Instructions for Japan 2025 Holiday Memories

## Project Overview

This is an interactive web application for capturing and saving keepsakes from a 2025 Japan holiday adventure. It's a comprehensive travel companion and digital scrapbook that helps users document memories, plan routes, explore locations, and test their knowledge about Japan.

## Technology Stack

- **Pure HTML/CSS/JavaScript**: No frameworks or build tools required
- **Local Storage API**: For data persistence in the browser
- **Google Charts API**: For QR code generation
- **Google Maps**: For route directions and maps
- **Netlify**: For hosting and serverless functions
- **Supabase** (optional): For cloud photo backup storage

## Code Structure

### Main Files
- `index.html`: Main HTML structure with all content sections
- `styles.css`: Complete styling for the application
- `script.js`: Core browser logic (obfuscated build)
- `supabase-upload.js`: Cloud backup helper for photo uploads
- `cloud-storage-shim.js`: Storage interface abstraction

### Netlify Functions
- `netlify/functions/generate-qr.js`: QR code generator function
- `netlify/functions/upload-photo.js`: Supabase photo uploader

## Key Features

1. **Memory Capture**: Photo uploads with drag & drop, memory entries with categorization
2. **Travel Companion**: Hotels, restaurants, attractions with QR codes
3. **Route Planning**: Pre-planned 1-3 day itineraries with Google Maps integration
4. **Interactive Quizzes**: Test Japan knowledge (Tokyo, Kyoto, Food, Culture)
5. **Photo of the Day**: Showcase best daily shots
6. **Highlights**: Auto-generated trip summary
7. **Bloopers Reel**: Share funny travel moments
8. **Weird Facts**: Fascinating trivia about each location
9. **Background Music**: Optional Japanese music player

## Development Practices

### Code Style
- Use vanilla JavaScript - no frameworks
- Maintain emoji-rich, fun interface style
- Keep all logic in browser-side JavaScript
- Use semantic HTML5 elements
- Ensure responsive design for mobile and desktop

### Data Management
- Primary storage: Local Storage API
- Optional backup: Supabase cloud storage
- All data should work offline-first
- Cloud sync is supplementary, not required

### Deployment
- Deploy to Netlify (configuration in `netlify.toml`)
- Netlify CLI available for local testing
- Environment variables for Supabase integration
- Catch-all redirect for deep links

### Dependencies
- Minimal dependencies (see `package.json`)
- `@supabase/supabase-js`: For cloud backup
- `qrcode`: For QR code generation in functions
- `netlify-cli` and `netlify-plugin-html-validate`: Dev dependencies

## Important Considerations

1. **Offline-First**: The app must work without internet connection
2. **No Build Step**: Direct HTML/CSS/JS files, no compilation needed
3. **Local Storage**: Primary persistence mechanism
4. **Progressive Enhancement**: Cloud features are optional
5. **Mobile Responsive**: Design must work on all screen sizes
6. **Japan Theme**: Maintain Japan-inspired aesthetic with emojis and colors

## Testing

- Test in modern browsers (Chrome, Firefox, Safari, Edge)
- Verify local storage persistence
- Test photo upload/drag-and-drop functionality
- Validate QR code generation
- Check responsive design on mobile devices
- HTML validation using `netlify-plugin-html-validate`

## Cloud Integration Notes

### Supabase Setup
- Optional feature for photo backup
- Requires environment variables in Netlify
- Supports new `sb_secret_*` keys (preferred) and legacy JWT keys
- Status indicators on photo cards (syncing, synced, queued, error)
- Retry mechanism for failed uploads

## File Organization

- Root level: Main application files
- `/assets`: Images and static assets
- `/netlify/functions`: Serverless function handlers
- `.htmlvalidate.json`: HTML validation configuration
- `.htmlvalidateignore`: Files to ignore during validation

## When Making Changes

1. **Preserve User Data**: Never break local storage compatibility
2. **Maintain Style**: Keep the fun, emoji-rich, Japan-inspired aesthetic
3. **Test Offline**: Ensure core features work without network
4. **Validate HTML**: Run HTML validation before committing
5. **Consider Mobile**: Always check responsive behavior
6. **Document Features**: Update FEATURES.md for significant additions
