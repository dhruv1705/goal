# Audio Assets for Breathing Exercise

## Directory Structure
```
assets/audio/
├── ambient/          # Background ambient sounds
│   ├── forest.mp3    # Forest sounds
│   ├── rain.mp3      # Rain sounds
│   ├── ocean.mp3     # Ocean waves
│   └── wind.mp3      # Gentle wind
└── guidance/         # Breath guidance sounds
    ├── chime.mp3     # Bell chime
    ├── gong.mp3      # Soft gong
    ├── bowl.mp3      # Singing bowl
    └── tone.mp3      # Pure tone
```

## Recommended Audio Specifications

### Ambient Files
- **Format**: MP3 or WAV
- **Duration**: 10-60 seconds (will loop)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192 kbps
- **Volume**: Normalized to -12dB to -6dB
- **Content**: Seamless loops without clicks

### Guidance Files  
- **Format**: MP3 or WAV
- **Duration**: 0.5-2 seconds
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192 kbps
- **Volume**: Normalized to -6dB to -3dB
- **Content**: Clear, pleasant tones

## Free Audio Resources

### Ambient Sounds
- **Freesound.org**: Search for "rain loop", "forest ambience", "ocean waves"
- **Zapsplat.com**: High-quality nature sounds
- **BBC Sound Effects**: Free nature recordings

### Guidance Tones
- **Freesound.org**: Search for "bell", "chime", "singing bowl"
- **Sample libraries**: Logic Pro, GarageBand built-in sounds
- **Online generators**: Tone generators for pure frequencies

## Usage in Code
Once you add audio files, update the BreathingExerciseModal.tsx to use them instead of generated sounds.