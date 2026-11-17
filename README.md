# 10 Minute School: HSC segment page prototype

A clickable prototype: the HSC 28 segment page, and from any subject the class page, where classes play and the class
materials (PDF) open and download. All data is sample data stored in the project; nothing is sent anywhere.

## Run it

Needs Node.js 20 or newer, and internet (fonts, YouTube videos and pictures load online).

```
npm install
npm run build
npm start
```

Then open http://localhost:3000. It opens the segment page; pick বিজ্ঞান, then tap a subject (Biology 1st paper has
the most content).

For editing, `npm run dev` instead of build + start.

## Notes

- Login is a demo: any 6-digit code works (for example 123456).
- Every class opens without logging in. Three classes have their own video; the others play one of those three.
- Every PDF is the same sample lecture slide.
- Subjects with a syllabus: Biology 1st and 2nd paper, Physics 1st paper, Chemistry 1st paper, Higher Math 1st paper.
  Other subjects open their routine.
