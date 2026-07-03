import localFont from "next/font/local";
import { Kalam, Caveat, Patrick_Hand, Gloria_Hallelujah } from "next/font/google";

export const kalufira = localFont({
  src: "../../public/fonts/kalufira.otf",
  weight: "400",
  style: "normal",
});

export const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
});

export const patrick = Patrick_Hand({
  subsets: ["latin"],
  weight: ["400"],
});

export const gloria = Gloria_Hallelujah({
  subsets: ["latin"],
  weight: ["400"],
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
});