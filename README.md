# STICKMAN DUEL II — 紫電 vs 紅蓮 · 燃える街

Pelea de stickmen al estilo anime en una ciudad en llamas (64 s, 1080p a 60 fps), hecha **100 % con código**: animación, física, efectos, cámara y banda sonora. Solo se usan tipografías libres (OFL).

**▶ Vídeo: [`stickman-duel-2.mp4`](stickman-duel-2.mp4)** · versión anterior: [`stickman-duel.mp4`](stickman-duel.mp4)

**紫電 SHIDEN** (el trueno violeta: ágil, coleta, bufanda larga y vendas en las muñecas) contra **紅蓮 GUREN** (el loto carmesí: corpulento, cuernos, melena salvaje, capa rasgada y venas de lava), en el Distrito 7 mientras arde.

| Tiempo | Escena |
|---|---|
| 0:00 | La ciudad ardiendo (helicópteros, explosiones lejanas) · Guren sobre un coche en llamas · Shiden cae con un rayo · **VS** |
| 0:08 | Carrera: los coches salen volando a su paso · choque de puños → lluvia de cristales, título **決戦** |
| 0:11 | Pelea en la calle: esquiva limbo, mortal hacia atrás, patada giratoria → Guren sale despedido (ragdoll) contra un coche · Guren lanza otro coche, Shiden lo **corta por la mitad** y las dos mitades explotan detrás de él · ráfaga de puñetazos · uppercut al cielo |
| 0:17 | Entre rascacielos: duelo de estelas, viñetas manga, siluetas contra la luna de sangre, choque gigante sobre las azoteas, pelea en caída libre junto a una fachada |
| 0:27 | Cráter · tormenta violeta y el fuego de toda la ciudad fluyendo hacia Guren · choque de rayos de energía · **限界突破** |
| 0:40 | Ojos en el humo · katana de rayo contra mandoble de fuego · seis choques de espada · **一閃** · el corte retardado: Guren cae y **el rascacielos detrás de él se parte en diagonal y se desliza** |
| 0:49 | Empieza a llover · respeto entre rivales · **完** |

## Cómo está hecho

- **Movimiento fluido**: cada articulación sigue sus keyframes mediante un muelle amortiguado, recibe la inercia de su pivote y el arrastre de la articulación padre (solapamiento, seguimiento y rebote). Además hay respiración, el rebote de boxeador y temblor al cargar energía. Los pies se fijan al suelo y dan un paso cuando la pierna se estira demasiado. En los movimientos rápidos se dibujan *smears*.
- **Física** (simulada antes de renderizar, con resultados deterministas):
  - ragdoll Verlet en los golpes fuertes y en la caída final;
  - cuerdas Verlet para la bufanda, la coleta, la capa, la faja y las vendas, con viento y ráfagas radiales en cada explosión;
  - cuerpos rígidos 2D para los coches, los coches cortados, la farola y la mitad del rascacielos;
  - cristales, escombros y chispas que rebotan.
- **Diseño cel-shading**: contorno negro por pieza, extremidades curvas, torso en V, pies, siluetas distintas para cada uno, impact frames en siluetas sólidas.
- **Ciudad**: tres capas de parallax de edificios con ventanas encendidas o en llamas, letreros de neón, columnas de humo, luna de sangre, helicópteros con focos, ascuas, ceniza, lluvia con salpicaduras.
- **Música y efectos de sonido**: sintetizados con `OfflineAudioContext` a 150 BPM:
  - instrumentos: guitarras distorsionadas, metales, coro, taikos, koto por síntesis Karplus-Strong;
  - el choque de rayos sube un tono;
  - efectos: cristales, chatarra, sirenas, lluvia y el derrumbe de la torre, todos disparados desde la misma lista de eventos que la imagen.

## Volver a renderizar

Requisitos: Node 18+, Playwright con Chromium y ffmpeg.

```bash
cd stickman-fight
npm install          # tipografías (Fontsource)
node render.js       # → ../stickman-duel-2.mp4
```

Opciones: `--from 9 --to 12`, `--workers 4`, `--crf 20`, `--no-audio`, `--keep-frames`, `--reuse-frames`, `--reuse-audio`, `--patch 6.4:6.6`.
Para explorar la animación, abre `stickman-fight/index.html` en el navegador (barra de tiempo + play); `test.html` muestra pruebas del rig.

```
stickman-fight/
  src/core.js        cámara, post-procesado (glow, impact frames, aberración, grano)
  src/rig.js         esqueleto, poses, keyframes
  src/physics.js     cuerdas, ragdoll, cuerpos rígidos, partículas con rebote
  src/actor.js       movimiento fluido (muelles + inercia + pies fijos) y bake de la física
  src/design.js      Shiden y Guren: dibujo, auras, espadas, smears
  src/city.js        la ciudad en llamas y la lluvia
  src/story.js       eventos, viento, cristales, escombros, coches
  src/shots2_*.js    los planos, en orden
  src/audio.js       banda sonora y efectos de sonido
```

El código de la primera versión (雷 vs 焔) está en el commit `2f3b610`.
