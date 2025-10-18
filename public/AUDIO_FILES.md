# Audio Files

This directory should contain the following MP3 files for the timer app to work properly:

## Required Files

### 1. hiit_next-level_40-20_x12.mp3
- **Size**: ~12 MB
- **Duration**: ~12 minutes
- **Format**: 40 seconds work / 20 seconds rest, 12 rounds
- **Used in**: HIIT Timer
- **Purpose**: Background music synchronized with HIIT workout phases

### 2. tabata_rocky_20-10_x4.mp3
- **Size**: ~3.7 MB
- **Duration**: ~4 minutes
- **Format**: 20 seconds work / 10 seconds rest, 8 rounds
- **Used in**: Tabata Timer
- **Purpose**: Background music synchronized with Tabata workout phases

## Why are these files not in Git?

These audio files are excluded from the Git repository due to their large size (15+ MB total). GitHub has file size limits, and including large binary files in Git history makes the repository slow to clone.

## How to add the audio files

1. Place the MP3 files in this `public/` directory
2. The file names must match exactly as listed above
3. The app will automatically load them when music mode is enabled

## Alternative: Using Git LFS

If you want to version control these files, you can use Git LFS:

```bash
# Install Git LFS
brew install git-lfs  # macOS
# or
apt-get install git-lfs  # Linux

# Initialize Git LFS
git lfs install

# Track MP3 files
git lfs track "*.mp3"

# Add and commit
git add .gitattributes
git add public/*.mp3
git commit -m "Add audio files with Git LFS"
git push
```

## Alternative: Using External Hosting

You can also host the MP3 files on external services like:
- AWS S3
- Google Cloud Storage
- CDN services
- Dropbox/Google Drive (public links)

Then update the audio configuration files:
- `/src/utils/audioUtils.js` - Update `HIIT_AUDIO_CONFIG` and `TABATA_AUDIO_CONFIG`
- Change `audioPath` to the external URL

## Fallback Mode

The app will work without these files - it will use beep sounds instead of music. Users can toggle between music mode and beeps-only mode in the timer settings.
