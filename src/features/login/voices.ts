import type { Dictionary } from "@/i18n/get-dictionary";
import type { LoginVoice } from "@/design-system/organisms/login/login-brand-panel";

/*
 * What the login panel says, in order: a line from the CEO, then two students. The students'
 * words are their own, exactly as published on the live site's catalogue testimonials (also in
 * src/data/snapshot/catalog.json), so they stay as written in both languages. The CEO line is a
 * placeholder until a real quote is supplied, and the panel labels it as a sample.
 * The photos are from 10 Minute School's felicitation event for top achievers
 * (ks.10minuteschool.com), captioned as such, not pictures of whoever is quoted.
 */

const PHOTO = {
  cheer: "/assets/login/felicitation-cheer.webp",
  selfie: "/assets/login/felicitation-selfie.webp",
  hall: "/assets/login/felicitation-hall.webp",
};

export function loginVoices(t: Dictionary["login"]): LoginVoice[] {
  return [
    {
      quote: t.ceoQuote,
      name: t.ceoName,
      role: t.ceoRole,
      avatarUrl: null,
      sample: true,
      photo: PHOTO.cheer,
    },
    {
      quote: "টেন মিনিট স্কুলের প্রতি আমি ভীষণরকমভাবে কৃতজ্ঞতা প্রকাশ করছি। … তাঁদের প্রতিটা কথায় ভরসা পেতাম।",
      name: "নাঈমা মাহমুদ পূর্বা",
      role: "৭৯ তম, জাহাঙ্গীরনগর বিশ্ববিদ্যালয় - ই ইউনিট",
      avatarUrl: "https://cdn.10minuteschool.com/cpd_images/thumbnails/নাঈমা_মাহমুদ_পূর্বা_৭৯_তম_জাহাঙ্গীরনগর_বিশ্ববিদ্যালয়_ই_ইউনিট_বিজনেস_স্টাডিজ_অনুষদ.jpg",
      sample: false,
      photo: PHOTO.selfie,
    },
    {
      quote: "SSC সময় ফিজিক্স ঠিকভাবে বুঝতাম না, তাই বিষয়টা তেমন ভালো লাগত না। কিন্তু এখন Rifat ভাইয়া এত সুন্দর করে বুঝান যে পড়তে সত্যিই ভালো লাগে, আর পরীক্ষাতেও ভালো নাম্বার পাচ্ছি।",
      name: "Zeba Anika",
      role: "Viqarunnisa Noon School and College",
      avatarUrl: "https://cdn.10minuteschool.com/images/page_builder/testimonials/authors/Zeba_1783178746472.jpeg",
      sample: false,
      photo: PHOTO.hall,
    },
  ];
}
