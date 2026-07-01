# Urus Case Book - Simple Admin Version

This version does NOT use Netlify Identity or Decap CMS.

## How editing works
- Open the website.
- Click **Admin**.
- Edit texts, dates, events and costs.
- Click **Save**.
- Changes are saved in your browser localStorage.

## Important
Because this is a static Netlify site, browser edits are local to your computer/browser.
To preserve changes permanently:
1. Click **Export JSON** in Admin.
2. Download `case.json`.
3. In GitHub, replace `content/case.json` with the exported file.
4. Netlify will redeploy automatically.

## Adding files
1. Upload photos/PDF/audio/video to GitHub:
   - photos: `assets/photos`
   - PDFs: `assets/documents`
   - audio: `assets/audio`
   - videos: `assets/videos`
2. In Admin, write the path, for example:
   - `assets/photos/engine1.jpg`
   - `assets/documents/mansory-report.pdf`
   - `assets/audio/knocking.m4a`
   - `assets/videos/engine-video.mp4`

## Export to PDF
Open the website and click **Export / Print PDF**.


## Fix note
This version fixes Admin mode so Edit buttons no longer return you to the dashboard.


## CaseBook Pro update
- Photos are now shown as controlled thumbnails, not huge full-size images.
- Click any photo to open it fullscreen.
- PDFs/documents display as document buttons.
- Videos and audio are kept in compact players.
