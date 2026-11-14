# Third-party notices

## Crew-Health-Monitor
MotivAid is built on **Crew-Health-Monitor** by AdityaK0804 (https://github.com/AdityaK0804/Crew-Health-Monitor), used and modified with the author's written permission (see `docs/PERMISSIONS.md`). Original concept, code and design credit belongs to its author.

## AstroBone (MIT)
The bones, muscles, heart and blood-vessel layers of the 3D body (`src/body/astrobone.ts`, used in `src/BodyScan.tsx`, including the heartbeat curve) are merged in from **AstroBone**. They replace the original body's heart, aorta, vessels and vertebral column. Code from (https://github.com/mysunatislam/astrobone-space-apps-2026). That includes the weight-bearing bone grouping and the meshopt GLB loading approach.

```
MIT License

Copyright (c) 2026 Mysunat Islam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 3D anatomy
- Bones, muscles, heart and vessels (`public/anatomy/astrobone/musculoskeletal.glb` and `cardiovascular.glb`, taken from AstroBone): **Z-Anatomy, CC BY-SA 4.0**, derived from BodyParts3D, The Database Center for Life Science, CC BY-SA 2.1 Japan. This is a share-alike licence: the model file and any changes to it stay under CC BY-SA 4.0. Full notice: `public/anatomy/astrobone/SOURCE-LICENSE.txt`.
- AstroBone's `human_body_clothed.glb` is **not used**: AstroBone's own notices say its licence is unknown.
- Male skin and organs: BodyParts3D, © The Database Center for Life Science, CC BY 4.0. Simplified for the web.
- Female skin and organs: HRA 3D Reference Organs (Visible Human female), HuBMAP Consortium, CC BY 4.0. Simplified for the web.

## Data
- Blood count data: NASA Open Science Data Repository, OSD-569.

## Fonts and icons
- Geist and Geist Mono (SIL Open Font License 1.1), via @fontsource-variable.
- Phosphor Icons (MIT).

Other npm dependencies keep their own licences (see `node_modules/*/LICENSE`).
