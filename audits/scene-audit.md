# Scene and interface audit — 2026-10-24

## Findings and fixes

- **Interleaved characters:** sorting all body faces together allowed pieces of different characters to mix. Each character now has a complete SVG group; faces sort inside that group.
- **Incorrect prop occlusion:** nearby solid props lived in fixed background or foreground layers. Registered props and characters now share a layer ordered by their ground positions, so walking past a prop changes the occlusion order.
- **Insufficient clearance:** body spacing and several obstacle footprints were too small or missing. All thirteen scenes now use the shared boundary solver, with footprints for nearby lamps, crates, rooftop equipment, trees, stalls, fountains, and other solid props. The solver checks candidate positions against both props and arena boundaries instead of clamping a character back inside an obstacle.
- **Batman artwork:** refined the cowl, jaw, armor, chest emblem, belt, and cape. Gargoyle wings use continuous membrane facets and ribs rather than intersecting triangles.
- **Stationary rooftop fan:** Batman's fan now rotates beneath its fixed cage. Spider-Man's fan and Max Payne's turbine remain animated; Bullet Time retains its existing simulation clock.
- **Project header:** added the project name, descriptive subtitle, and a repository pill that matches the tab-bar height. The selector reduces its visible tabs as space decreases. Header text uses the scene-contrast token across all palettes.

## Verification

- Spatial suite: 13 scenes, 6,626 obstacle/boundary probes, 3,120 movement frames, crowded starts including the larger Wight, character grouping, prop order, and all three rooftop fans in Game and Video modes.
- Existing rig, combat, keyboard, touch-controller, scene-navigation, and Bullet Time regression checks retained.
- Contrast: 221 checks across 13 palettes, plus meter-color separation checks.
- Browser review: all 13 scenes and seven layouts (320×844, 390×844, 768×1024, 1024×768, 844×390, 1366×768 with touch, and 1440×1000). Checked overflow, header spacing, tab/button heights, repository link, responsive defaults, dropdown selection, and touch controls. No browser JavaScript errors were reported.
- Regenerated all navigation previews from the updated artwork.

## Scope and limits

This remains an SVG painter's-order renderer, not a per-pixel 3D depth buffer. Nearby solid props use grouped depth ordering; distant architecture remains part of the backdrop. Collision footprints approximate objects in the ground plane. Weapons and capes can overlap during intentional combat poses, but body spacing and solid-prop clearance are enforced.

Browser touch emulation does not measure performance or browser chrome on physical phones. Existing trailer exports were renamed for the project; their recorded footage was not re-rendered.
