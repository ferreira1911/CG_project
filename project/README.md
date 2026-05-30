# Wagon Rush

## CGRA 2025/2026 - Class T01 - Group 05

| Name | Student Number |
| --- | --- |
| Gonçalo Ferreira | 202304562 |
| João Santos | 202303908 |
| João Furtado | 202305812 |

---

## Project Description

**Wagon Rush** is an interactive 3D survival game built with WebCGF for the CG final project. The player drives a horse-drawn covered wagon through a spring prairie, collects hay bales, carries them on the wagon, and delivers them to the barn drop-off area to recover health points.

The scene includes a panoramic sky sphere, directional sun light, elevated terrain with paths and detail textures, rocks, trees, flowers, dense grass, a barn, animated hay bales with guide arrows, a detailed wagon, an imported OBJ horse, a seated driver, reins, and a wooden tongue/hitch system connected to the horse. The gameplay loop combines keyboard driving, health drain over time, collisions, knockback, camera shake, pickup/drop mechanics, score tracking, and UI feedback.

---

## How to Run

No external package installation is required. The WebCGF library and project resources are included in the repository.

Recommended launch method used by the group:

1. Open the repository root in Visual Studio Code.
2. Install or enable the **Live Server** extension.
3. Right-click `project/index.html`.
4. Select **Open with Live Server**.
5. Open:

```text
http://localhost:5500/project/index.html
```

Any equivalent static HTTP server can also be used, as long as `project/index.html` is served through `localhost`.

---

## Keyboard Controls

| Key | Action |
| --- | --- |
| `Space` | Start the game from the main menu |
| `W` | Accelerate forward |
| `S` | Brake / decelerate |
| `A` | Steer left |
| `D` | Steer right |
| `P` | Pick up the nearest hay bale, up to 2 carried bales |
| `L` | Drop the last carried hay bale |
| `R` | Restart after game over |
| `F` | Toggle free camera |

The DAT.gui panel also exposes inspection and tuning controls for scene visibility, wind parameters, flora generation, world generation, barn placement, and gameplay statistics.

---

## Implemented Features

### Core Required Features

- **Spring prairie scene** with a large sky sphere, terrain, paths, barn, wagon, horse, rocks, flowers, trees, grass, hay bales, and gameplay UI.
- **Sky, sun, and lighting** using a panoramic environment sphere and a directional sun light shared with custom shaders.
- **Elevated terrain** based on a heightmap, with CPU-side height sampling so generated objects and the wagon sit correctly on the ground.
- **Ground surface and wagon path** using terrain textures, path textures, a path mask, and shader blending for dirt, pebbles, rocky zones, leaves, and flower detail.
- **Scatter elements** including multiple rocks with randomized scale, rotation, texture choice, and shader deformation.
- **Flora** with parameterized flowers and trees generated from reusable procedural geometry.
- **Grass and dry patches** generated in dense baked patches, with variation in height, color, bending, stiffness, and dryness.
- **Covered light wagon** with wooden bed, side rails, half-length cloth cover, four rotating wheels, front tongue, imported OBJ horse, driver, reins, and carried hay bales.
- **Wagon interaction mechanics** with forward acceleration, braking, smooth steering, pickup, drop, and a maximum of two carried hay bales.
- **Barn and drop-off area** with wood plank textures, dark roof, door/window facade textures, side windows, and a circular delivery area that changes color when the wagon intersects it.
- **Gameplay loop** with HP drain over time, collision damage, hay bale delivery restoring HP, delivered bale counter, score timer, game-over screen, and restart.
- **Collision feedback** against rocks, trees, barn, and map boundary using knockback, temporary invulnerability, and camera shake. The map boundary blocks the wagon without dealing damage.
- **Animations** for wagon wheel rotation, steering, horse movement, hay bale drop, guide arrows, intro camera, tree falling after impact, grass wind, and dust while driving.
- **Interface elements** through DAT.gui and an in-game HUD for health, score, delivered bales, instantaneous damage, and restored HP.

### Advanced / Bonus Features Implemented

- **Advanced sky/clouds:** procedural animated cloud layer in the sky shader over the panoramic sphere.
- **Advanced scatter generation:** procedural placement of rocks, hay bales, trees, flower clusters, and grass with overlap/path validation.
- **Advanced flora generation:** flowers and trees are built procedurally from parameterized geometry, then baked into meshes/batches for rendering efficiency.
- **Advanced grass shader:** dense grass is animated by a wind shader and also bends away from the horse and wagon wheels.
- **Advanced wagon model:** the wagon includes textured wooden parts, cloth cover, articulated front steering, rotating wheels, carried bales, driver, reins, dust, and a double-shaft tongue attached to the horse.
- **Advanced horse movement:** the imported horse follows the wagon steering, animates while moving, and drives the visual hitch/rein attachment points.
- **Advanced interaction physics:** acceleration, braking, friction, steering return, terrain pitch/roll, and collision knockback are handled with time-based kinematics.
- **Advanced barn feedback:** the delivery circle has translucent visual feedback and changes state when the wagon overlaps it.
- **Advanced shaders:** custom shaders are used for sky/clouds, terrain blending, grass wind, animated arrows, rock deformation/lighting, cloth lighting, and branch/flora lighting.

---

## Known Issues / Limitations

- No blocking gameplay issues are currently known.
- The scene uses directional lighting, materials, and shader-based shading, but it does not implement real shadow maps. This was kept out because dynamic shadows are not required by the project statement.
- The free camera is intended for inspection/debugging. The intended gameplay camera is the wagon follow camera.

---

## Screenshots

| Required View | File |
| --- | --- |
| Overall scene overview | [screenshots/delivery/project-t01g05-1.png](screenshots/delivery/project-t01g05-1.png) |
| Flower, rocks, and floor detail | [screenshots/delivery/project-t01g05-2.png](screenshots/delivery/project-t01g05-2.png) |
| Wagon close-up | [screenshots/delivery/project-t01g05-3.png](screenshots/delivery/project-t01g05-3.png) |
| Shader animation | [screenshots/delivery/project-t01g05-4.gif](screenshots/delivery/project-t01g05-4.gif) |
| Gameplay / hay bale interaction | [screenshots/interaction/interaction_haybale.png](screenshots/interaction/interaction_haybale.png) |

---

## AI Use Declaration

AI assistance was used as a development support tool to review the project against the statement, identify inconsistencies, improve code organization and comments, debug visual/gameplay issues, and help write this README. The implementation, integration, testing, and final decisions were reviewed and controlled by the group members.
