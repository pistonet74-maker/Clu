# STICKMAN DUEL — 雷 vs 焔

Un vídeo de pelea de stickmen al estilo anime (57,6 s, 1080p a 60 fps), hecho **100 % con código**: la animación, los efectos, la cámara y también la banda sonora. No se usa ningún asset externo salvo tipografías libres (OFL).

**▶ Vídeo: [`stickman-duel.mp4`](stickman-duel.mp4)**

**RAI (雷, el trueno)** contra **HOMURA (焔, la llama)**: un duelo a medianoche bajo una luna gigante.

| Tiempo | Escena |
|---|---|
| 0:00 | Plano general del páramo a medianoche · primeros planos con la tarjeta de cada luchador · pantalla dividida **VS** |
| 0:08 | Los dos se lanzan, chocan los puños → *impact frames*, onda expansiva que abre las nubes, título **決戦 · FINAL CLASH** |
| 0:11 | Pelea en tierra: esquiva + uppercut, patada giratoria de fuego, ráfaga de puñetazos, golpe contra el pilar, teletransporte, agarre y lanzamiento, golpe de rayo, bolas de fuego desviadas, ataque por la espalda |
| 0:19 | Batalla en el cielo: estelas que chocan alrededor de la luna, viñetas manga a pantalla completa, siluetas frente a la luna, colisión gigante, patada hacha y caída como meteorito |
| 0:27 | Rai se levanta del cráter → *power-up* de trueno, *power-up* de fuego, pantalla dividida |
| 0:33 | **Choque de rayos de energía**: forcejeo, **全力 · FULL POWER**, explosión total |
| 0:40 | Ojos en el humo, katanas de rayo y de fuego, un solo corte (**一閃**) y el golpe retardado |
| 0:46 | Amanecer, respeto entre rivales · **完** |

## Cómo está hecho

- **Animación**: `<canvas>` 2D en Chromium sin interfaz. Cada fotograma es una función pura del tiempo `t`, así que se renderizan en paralelo y en cualquier orden.
- **Stickmen**: esqueleto con cinemática directa, biblioteca de ~40 poses, keyframes con *easing*, IK de dos huesos para apoyar los pies, cinta y bufanda que ondean según la velocidad y el viento.
- **Efectos anime**: *impact frames* en blanco y negro, líneas de concentración (集中線), *hit-stop*, temblor de cámara, aberración cromática, imágenes residuales, rayos fractales, fuego y chispas con partículas deterministas, ondas expansivas, cráteres, escombros, rayos de energía, glow/bloom.
- **Música y SFX**: sintetizados con `OfflineAudioContext` (150 BPM, re menor): taikos, batería, bajo, *supersaws*, koto por síntesis Karplus-Strong, coro, *risers*, y cada golpe disparado desde la misma lista de eventos que la imagen, así que todo está sincronizado al fotograma.
- **Montaje**: `ffmpeg` (H.264 + AAC).

## Volver a renderizar

Requisitos: Node 18+, Playwright con Chromium y ffmpeg.

```bash
cd stickman-fight
npm install          # tipografías (Fontsource)
node render.js       # → ../stickman-duel.mp4  (≈10 min con 4 núcleos)
```

Opciones: `--from 9 --to 12` (fragmento), `--workers 4`, `--crf 20`, `--no-audio`, `--keep-frames`.
Para explorar la animación fotograma a fotograma, abre `stickman-fight/index.html` en el navegador (barra de tiempo + play).

```
stickman-fight/
  index.html          página que carga el motor
  render.js           render paralelo → ffmpeg
  src/core.js         matemáticas, cámara, post-procesado
  src/rig.js          esqueleto, poses, keyframes, dibujo de personajes
  src/fx.js           partículas y efectos
  src/world.js        cielo, luna, nubes, montañas, suelo
  src/story.js        utilidades de la historia + lista de eventos
  src/shots_*.js      los planos, en orden
  src/audio.js        banda sonora y efectos de sonido
  tools/              capturas y render de audio sueltos
```
