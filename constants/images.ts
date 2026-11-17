import brandLogo from "@/assets/images/icon.png";
import mascotCat from "@/assets/images/mascots/cat.png";
import mascotParrot from "@/assets/images/mascots/parrot.png";
import flagEnglish from "@/assets/images/flags/english.png";
import flagFrench from "@/assets/images/flags/french.png";
import flagSwahili from "@/assets/images/flags/tanzania.png";
import firstStepsScene from "@/assets/images/scenes/first-steps.jpg";
import everydayLifeScene from "@/assets/images/scenes/everyday-life.jpg";
import foundationsScene from "@/assets/images/scenes/language-foundations.jpg";
import travelScene from "@/assets/images/scenes/places-and-travel.jpg";

// The same original companions appear throughout the app.
export const images = {
  brandLogo,
  mascotCat,
  mascotParrot,
  flagEnglish,
  flagFrench,
  flagSwahili,
  firstStepsScene,
  everydayLifeScene,
  foundationsScene,
  travelScene,
} as const;

// Unit order is shared by all launch courses. Keep images in one place so
// lesson and course screens always use the same artwork.
export const unitScenes = [
  images.firstStepsScene,
  images.everydayLifeScene,
  images.foundationsScene,
  images.travelScene,
] as const;
