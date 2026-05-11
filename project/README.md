# CGRA Final Project


---

## Brief Description


---

## Instructions to Run


---

## Keyboard Controls
| Key | Action |
|-----|--------|
| **W** | Accelerate forward |
| **S** | Brake / Decelerate |
| **A / D** | Steer Left / Right |
| **P** | Pick up nearest Haybale (max 2) |
| **L** | Drop carried Haybale |

*Note: GUI toggles are available in the top-right corner to switch to a Free Camera and to toggle visibility for UI elements and scene objects.*

---

## Features Implemented
*   **Terrain Generation**: Driven by heightmap and mask textures, with bilinear filtering.
*   **Wagon & Horse Kinematics**: Ackermann-style steering, centrifugal camera lean, and dynamic horse placement/pitching based on terrain slope.
*   **Procedural Flora**: Trees and bushes generated recursively with randomized branches and leaf canopies.
*   **Instanced Grass**: Vast fields of grass rendered efficiently using instancing.
*   **Dynamic Shaders**: 
    *   *Arrow Shader*: Vertex bobbing, squash-and-stretch, and continuous Y-axis rotation with a pulsing neon fragment shader.
    *   *Rock Shader*: Vertex displacement noise to create organic, bumpy obstacles.
    *   *Flora Shader*: Simulates wind swaying on branches and leaves.
*   **Collision Detection**: Bounding-circle collision against rocks, causing health loss, knockback, and screen shake.
*   **Cinematic Camera Animator**: An 8-second intro sequence that transitions from a wide panorama shot smoothly down to the player.
*   **Distance Culling**: Optimization to only draw complex geometries (rocks, flora, bales) when within the camera's visual range.

### Bonus Features
*   **Advanced Shader Integration**: Multiple highly customized shaders (Arrow animations, Rock vertex displacement).
*   **Cinematic Intro Sequence**: Custom camera animator with cubic easing and delayed execution.
*   **Gameplay Loop**: Functional pickup/drop logic with animated UI (Health Bar) and visual indicators (bobbing arrows).

---

## Known Issues / Limitations

---

## 🖼️ Screenshots
*(Thumbnails or links to the 5 required screenshots)*
1. [Screenshot 1 Description](./screenshots/SceneOverview.png)
2. [Screenshot 2 Description](./screenshots/rock.png)
3. [Screenshot 3 Description](./screenshots/flower.png)

---


