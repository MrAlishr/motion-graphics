// Rename to brand.js beside showreel.html. Every field is optional — the
// template falls back to a neutral dark-blue theme for anything you omit.
// On first run the skill fills this in from YOUR project's colors/fonts/name.
window.BRAND = {
  name: 'Your Project',            // headline (auto-shrinks to fit)
  tagline: 'What it does, one line',
  dir: 'ltr',                      // 'rtl' for Arabic/Persian/Hebrew

  // Fonts: any Google Fonts. Update fontsUrl to load the families you name.
  displayFont: 'Poppins',          // titles / big numbers
  bodyFont: 'Inter',               // body / labels
  fontsUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&family=Inter:wght@400;600&display=swap',

  // Palette (hex). brand = primary, accent = one pop color used sparingly.
  ink: '#F5F7FA',                  // text on the dark canvas
  bg1: '#131C2E', bg2: '#0B1220', bg3: '#080D16',  // vertical gradient stops
  brand: '#3B82F6', brandLight: '#60A5FA', brandDark: '#1E3A8A',
  accent: '#F59E0B',

  // Demo chips (scene 2). icon ∈ bolt shield spark heart globe check rocket
  // star chat play — any other name renders its first letter.
  features: [
    ['bolt', 'Fast'], ['shield', 'Secure'], ['spark', 'Simple'],
    ['heart', 'Loved'], ['globe', 'Everywhere'],
  ],
};
