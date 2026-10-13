import { Poppins, Inter, Montserrat, Cairo, Caveat, Kalam, Playfair_Display, Fraunces, DM_Sans, Sora, Space_Grotesk, Manrope, Patrick_Hand, Indie_Flower, Shadows_Into_Light, Reenie_Beanie, Dancing_Script, Permanent_Marker, Homemade_Apple, Nanum_Pen_Script, Gloria_Hallelujah, Covered_By_Your_Grace, Zeyada, Sacramento } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import RestoreLoader from '@/components/RestoreLoader';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Handwritten faces, for the storyboard's text (the Font menu: a chat box can be written by hand).
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});
const kalam = Kalam({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-kalam',
  display: 'swap',
});

// Faces for the storyboard's text (the Font menu): two serifs and four sans, all variable fonts (every weight).
// preload: false: nothing is fetched until a frame's text uses one, so no other page pays for them.
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', preload: false });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', preload: false });
const dmsans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap', preload: false });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', preload: false });
const spacegrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-spacegrotesk', display: 'swap', preload: false });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap', preload: false });

// More handwriting for the storyboard's text (the Font menu, and the pen animation): twelve faces, one weight each (Dancing Script is variable).
const patrickhand = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-patrickhand', display: 'swap', preload: false });
const indieflower = Indie_Flower({ subsets: ['latin'], weight: '400', variable: '--font-indieflower', display: 'swap', preload: false });
const shadowsintolight = Shadows_Into_Light({ subsets: ['latin'], weight: '400', variable: '--font-shadowsintolight', display: 'swap', preload: false });
const reeniebeanie = Reenie_Beanie({ subsets: ['latin'], weight: '400', variable: '--font-reeniebeanie', display: 'swap', preload: false });
const dancingscript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancingscript', display: 'swap', preload: false });
const permanentmarker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-permanentmarker', display: 'swap', preload: false });
const homemadeapple = Homemade_Apple({ subsets: ['latin'], weight: '400', variable: '--font-homemadeapple', display: 'swap', preload: false });
const nanumpen = Nanum_Pen_Script({ subsets: ['latin'], weight: '400', variable: '--font-nanumpen', display: 'swap', preload: false });
const gloria = Gloria_Hallelujah({ subsets: ['latin'], weight: '400', variable: '--font-gloria', display: 'swap', preload: false });
const coveredbygrace = Covered_By_Your_Grace({ subsets: ['latin'], weight: '400', variable: '--font-coveredbygrace', display: 'swap', preload: false });
const zeyada = Zeyada({ subsets: ['latin'], weight: '400', variable: '--font-zeyada', display: 'swap', preload: false });
const sacramento = Sacramento({ subsets: ['latin'], weight: '400', variable: '--font-sacramento', display: 'swap', preload: false });

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Arabic-capable face, applied via CSS when the document is dir="rtl" / lang="ar"
// (the Latin faces above don't carry Arabic glyphs).
// Cairo is a variable font: load it as one variable face (all weights) rather
// than a weight list, which yields duplicate font-file entries that Turbopack's
// dev server fails to resolve.
const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata = {
  title: 'Taskmaverick · Automated Business Manager',
  description: 'Watch the Taskmaverick overview, chapter by chapter.',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: some browser extensions inject attributes onto
    // <html> (e.g. crxlauncher, Grammarly) before React hydrates, which would
    // otherwise trip a hydration mismatch warning on the root element. This only
    // relaxes attribute checking on <html> itself, nothing deeper.
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} ${montserrat.variable} ${caveat.variable} ${kalam.variable} ${playfair.variable} ${fraunces.variable} ${dmsans.variable} ${sora.variable} ${spacegrotesk.variable} ${manrope.variable} ${patrickhand.variable} ${indieflower.variable} ${shadowsintolight.variable} ${reeniebeanie.variable} ${dancingscript.variable} ${permanentmarker.variable} ${homemadeapple.variable} ${nanumpen.variable} ${gloria.variable} ${coveredbygrace.variable} ${zeyada.variable} ${sacramento.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Runs before the body paints: if we're returning into the Use Cases
            view (/#use-cases), flag the restore so the loader below shows on the
            very first frame — no flash of the landing before it appears. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(location.hash==='#use-cases'){document.documentElement.classList.add('tm-boot-restore')}}catch(e){}",
          }}
        />
        <RestoreLoader />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
