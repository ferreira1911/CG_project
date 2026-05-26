# CGRA Final Project

## Wagon Rush

### CGRA 2025/2026 - Class T01 - Group 05

| Name | Student Number |
| --- | --- |
| Gonçalo Ferreira | 202304562 |
| João Santos | 202303908 |
| João Furtado | 202305812 |

---

## Brief Description

**Wagon Rush** is a real-time 3D scene built with WebCGF where the player drives a horse-drawn wagon through a rural environment. The goal is to collect hay bales, carry them on the wagon, and deliver them to the barn while avoiding collisions with rocks and other obstacles.

The scene combines an interactive gameplay loop with a visually rich countryside setting: a heightmap-based terrain, a barn with a drop-off area, a wagon with articulated wheels and a horse hitch, procedural vegetation, animated grass, rocks, hay bales with guidance arrows, a driver sitting on the wagon, and several custom shaders for movement and visual feedback.

---

## Instructions to Run

No external package installation is required. The project runs directly in a browser, but it must be served through a local HTTP server so textures, shaders, and OBJ resources load correctly.

We used the **Live Server** extension for Visual Studio Code. Open the repository in VS Code, right-click `project/index.html`, and choose **Open with Live Server**.

The project is then available at:

```text
http://localhost:5500/project/index.html
```

---

## Keyboard Controls

| Key | Action |
| --- | --- |
| **Space** | Start the game from the main menu |
| **W** | Accelerate forward |
| **S** | Brake / decelerate |
| **A** | Steer left |
| **D** | Steer right |
| **P** | Pick up the nearest hay bale, up to 2 carried bales |
| **L** | Drop the last carried hay bale |
| **R** | Restart after game over |
| **F** | Toggle free camera |

*Note: GUI controls are available in the top-right corner to switch camera mode, place the barn, inspect gameplay values, and toggle scene objects.*

---

## Features Implemented

### Core Scene and Interaction Features

* **Interactive Wagon Gameplay**: the player drives a horse-drawn wagon, collects hay bales, carries up to two at once, and delivers them to the barn drop-off area.
* **Horse-Drawn Wagon**: the wagon includes a wooden bed, cover, rotating wheels, steering behavior, a driver, reins, and a tongue/hitch visually connected to the horse.
* **Horse Animation and Hitch Alignment**: the horse follows the wagon steering and movement, with the hitch points updated from the horse position so the wooden tongue and reins remain visually attached.
* **Driver Model**: a simple seated driver built from primitives, with body, head, arms, legs, and hat.
* **Hay Bale System**: hay bales can be picked up, carried on the wagon, dropped with a falling animation, and delivered for score.
* **Barn and Delivery Area**: the barn has textured walls, roof, front facade, side windows, and a visible drop-off area used for hay bale delivery.
* **Heightmap Terrain**: the terrain uses a heightmap for elevation and CPU-side height sampling so objects such as the wagon, horse, rocks, trees, flowers, hay bales, and grass sit on the ground.
* **Path Mask Usage**: the terrain mask is used to define paths and to avoid spawning objects directly on blocked/path areas.
* **Dynamic Wagon Orientation**: the wagon adjusts pitch and roll according to terrain height samples, giving a better sense of movement over slopes.
* **Collisions and Damage**: the wagon collides with rocks, trees, and the barn, causing damage, knockback, temporary invulnerability, and camera shake.
* **Tree Impact Animation**: trees can fall after being hit by the wagon.
* **Procedural Vegetation**: the scene includes procedurally generated trees and flower clusters with randomized shapes, colors, placement, and scale.
* **Grass Fields**: grass is generated in large baked patches, avoids paths and scene obstacles, and includes variation in height, color, bend, and dryness.
* **HUD and Game State**: the interface displays health, score, delivered bales, carried bales, floating feedback text, game over, and restart behavior.
* **Camera System**: the project includes a follow camera, a free camera toggle, and an intro camera animation.
* **Distance Culling**: rocks, flora, and hay bales are culled by distance to reduce unnecessary rendering work.

### Advanced / Bonus Features Implemented

TODO.

---

## Known Issues / Limitations

TODO.

---

## Screenshots

*(Thumbnails or links to the 5 required screenshots)*

TODO.

---

## AI Use Declaration

TODO.
