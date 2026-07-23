/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// Helper to set blocks in Map
function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function generateSphere(map: Map<string, VoxelData>, cx: number, cy: number, cz: number, r: number, col: number, sy = 1) {
    const r2 = r * r;
    const xMin = Math.floor(cx - r);
    const xMax = Math.ceil(cx + r);
    const yMin = Math.floor(cy - r * sy);
    const yMax = Math.ceil(cy + r * sy);
    const zMin = Math.floor(cz - r);
    const zMax = Math.ceil(cz + r);

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            for (let z = zMin; z <= zMax; z++) {
                const dx = x - cx;
                const dy = (y - cy) / sy;
                const dz = z - cz;
                if (dx * dx + dy * dy + dz * dz <= r2) {
                    setBlock(map, x, y, z, col);
                }
            }
        }
    }
}

export type PresetType = 
    | 'Eagle' 
    | 'Cat' 
    | 'Rabbit' 
    | 'Twins' 
    | 'Dragon' 
    | 'Robot' 
    | 'Castle' 
    | 'Spaceship' 
    | 'Car' 
    | 'Panda' 
    | 'Rocket' 
    | 'PirateShip' 
    | 'TreasureChest' 
    | 'House'
    | 'MegaMetropolis100k'
    | 'VolcanoIsland120k'
    | 'SphereMatrix100k'
    | 'TitanColossus150k'
    | 'GalaxyCluster200k'
    | 'CyberCity250k';

/**
 * Upscales any model data by subdividing each voxel into sub-voxels
 * e.g., multiplier = 4 turns 1 voxel into 4x4x4 = 64 sub-voxels!
 */
export function upscaleVoxelData(data: VoxelData[], subDivisions: number): VoxelData[] {
    if (subDivisions <= 1) return data;
    
    const result: VoxelData[] = [];
    const step = 1 / subDivisions;
    const offset = (1 - step) / 2;

    for (let i = 0; i < data.length; i++) {
        const v = data[i];
        const baseX = v.x;
        const baseY = v.y;
        const baseZ = v.z;

        for (let dx = 0; dx < subDivisions; dx++) {
            for (let dy = 0; dy < subDivisions; dy++) {
                for (let dz = 0; dz < subDivisions; dz++) {
                    result.push({
                        x: +(baseX + (dx * step) - offset).toFixed(3),
                        y: +(baseY + (dy * step) - offset).toFixed(3),
                        z: +(baseZ + (dz * step) - offset).toFixed(3),
                        color: v.color
                    });
                }
            }
        }
    }
    return result;
}

export const Generators: Record<PresetType, () => VoxelData[]> = {
    Eagle: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let x = -8; x < 8; x++) {
            const y = Math.sin(x * 0.2) * 1.5;
            const z = Math.cos(x * 0.1) * 1.5;
            generateSphere(map, x, y, z, 1.8, COLORS.WOOD);
            if (Math.random() > 0.7) generateSphere(map, x, y + 2, z + (Math.random() - 0.5) * 3, 1.5, COLORS.GREEN);
        }
        const EX = 0, EY = 2, EZ = 2;
        generateSphere(map, EX, EY + 6, EZ, 4.5, COLORS.DARK, 1.4);
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY + 4; y <= EY + 9; y++) setBlock(map, x, y, EZ + 3, COLORS.LIGHT);
        for (let x of [-4, -3, 3, 4]) for (let y = EY + 4; y <= EY + 10; y++) for (let z = EZ - 2; z <= EZ + 3; z++) setBlock(map, x, y, z, COLORS.DARK);
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY; y <= EY + 4; y++) for (let z = EZ - 5; z <= EZ - 3; z++) setBlock(map, x, y, z, COLORS.WHITE);
        const HY = EY + 12, HZ = EZ + 1;
        generateSphere(map, EX, HY, HZ, 2.8, COLORS.WHITE);
        generateSphere(map, EX, HY - 2, HZ, 2.5, COLORS.WHITE);
        [[-2, 0], [-2, 1], [2, 0], [2, 1]].forEach(o => setBlock(map, EX + o[0], EY + o[1], EZ, COLORS.TALON));
        [[0, 1], [0, 2], [1, 1], [-1, 1]].forEach(o => setBlock(map, EX + o[0], HY, HZ + 2 + o[1], COLORS.GOLD));
        setBlock(map, EX, HY - 1, HZ + 3, COLORS.GOLD);
        [[-1.5, COLORS.BLACK], [1.5, COLORS.BLACK]].forEach(o => setBlock(map, EX + o[0], HY + 0.5, HZ + 1.5, o[1]));
        [[-1.5, COLORS.WHITE], [1.5, COLORS.WHITE]].forEach(o => setBlock(map, EX + o[0], HY + 1.5, HZ + 1.5, o[1]));
        return Array.from(map.values());
    },

    Cat: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1; const CX = 0, CZ = 0;
        generateSphere(map, CX - 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        generateSphere(map, CX + 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        for (let y = 0; y < 7; y++) {
            const r = 3.5 - (y * 0.2);
            generateSphere(map, CX, CY + 2 + y, CZ, r, COLORS.DARK);
            generateSphere(map, CX, CY + 2 + y, CZ + 2, r * 0.6, COLORS.WHITE);
        }
        for (let y = 0; y < 5; y++) {
            setBlock(map, CX - 1.5, CY + y, CZ + 3, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 3, COLORS.WHITE);
            setBlock(map, CX - 1.5, CY + y, CZ + 2, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 2, COLORS.WHITE);
        }
        const CHY = CY + 9;
        generateSphere(map, CX, CHY, CZ, 3.2, COLORS.LIGHT, 0.8);
        [[-2, 1], [2, 1]].forEach(side => {
            setBlock(map, CX + side[0], CHY + 3, CZ, COLORS.DARK); setBlock(map, CX + side[0] * 0.8, CHY + 3, CZ + 1, COLORS.WHITE);
            setBlock(map, CX + side[0], CHY + 4, CZ, COLORS.DARK);
        });
        for (let i = 0; i < 12; i++) {
            const a = i * 0.3, tx = Math.cos(a) * 4.5, tz = Math.sin(a) * 4.5;
            if (tz > -2) { setBlock(map, CX + tx, CY, CZ + tz, COLORS.DARK); setBlock(map, CX + tx, CY + 1, CZ + tz, COLORS.DARK); }
        }
        setBlock(map, CX - 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD); setBlock(map, CX + 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD);
        setBlock(map, CX - 1, CHY + 0.5, CZ + 3, COLORS.BLACK); setBlock(map, CX + 1, CHY + 0.5, CZ + 3, COLORS.BLACK);
        setBlock(map, CX, CHY, CZ + 3, COLORS.TALON);
        return Array.from(map.values());
    },

    Rabbit: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const LOG_Y = CONFIG.FLOOR_Y + 2.5;
        const RX = 0, RZ = 0;
        for (let x = -6; x <= 6; x++) {
            const radius = 2.8 + Math.sin(x * 0.5) * 0.2;
            generateSphere(map, x, LOG_Y, 0, radius, COLORS.DARK);
            if (x === -6 || x === 6) generateSphere(map, x, LOG_Y, 0, radius - 0.5, COLORS.WOOD);
            if (Math.random() > 0.8) setBlock(map, x, LOG_Y + radius, (Math.random() - 0.5) * 2, COLORS.GREEN);
        }
        const BY = LOG_Y + 2.5;
        generateSphere(map, RX - 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX + 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX, BY + 2, RZ, 2.2, COLORS.WHITE, 0.8);
        generateSphere(map, RX, BY + 2.5, RZ + 1.5, 1.5, COLORS.WHITE);
        setBlock(map, RX - 1.2, BY, RZ + 2.2, COLORS.LIGHT); setBlock(map, RX + 1.2, BY, RZ + 2.2, COLORS.LIGHT);
        setBlock(map, RX - 2.2, BY, RZ - 0.5, COLORS.WHITE); setBlock(map, RX + 2.2, BY, RZ - 0.5, COLORS.WHITE);
        generateSphere(map, RX, BY + 1.5, RZ - 2.5, 1.0, COLORS.WHITE);
        const HY = BY + 4.5; const HZ = RZ + 1;
        generateSphere(map, RX, HY, HZ, 1.7, COLORS.WHITE);
        generateSphere(map, RX - 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        generateSphere(map, RX + 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        for (let y = 0; y < 5; y++) {
            const curve = y * 0.2;
            setBlock(map, RX - 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX - 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX - 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
            setBlock(map, RX + 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX + 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX + 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
        }
        setBlock(map, RX - 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK); setBlock(map, RX + 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK);
        setBlock(map, RX, HY - 0.5, HZ + 1.8, COLORS.TALON);
        return Array.from(map.values());
    },

    Twins: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        function buildMiniEagle(offsetX: number, offsetZ: number, mirror: boolean) {
            for (let x = -5; x < 5; x++) {
                const y = Math.sin(x * 0.4) * 0.5;
                generateSphere(map, offsetX + x, y, offsetZ, 1.2, COLORS.WOOD);
                if (Math.random() > 0.8) generateSphere(map, offsetX + x, y + 1, offsetZ, 1, COLORS.GREEN);
            }
            const EX = offsetX, EY = 1.5, EZ = offsetZ;
            generateSphere(map, EX, EY + 4, EZ, 3.0, COLORS.DARK, 1.4);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 6; y++) setBlock(map, x, y, EZ + 2, COLORS.LIGHT);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 3; y++) setBlock(map, x, y, EZ - 3, COLORS.WHITE);
            for (let y = EY + 2; y <= EY + 6; y++) for (let z = EZ - 1; z <= EZ + 2; z++) { setBlock(map, EX - 3, y, z, COLORS.DARK); setBlock(map, EX + 3, y, z, COLORS.DARK); }
            const HY = EY + 8, HZ = EZ + 1;
            generateSphere(map, EX, HY, HZ, 2.0, COLORS.WHITE);
            setBlock(map, EX, HY, HZ + 2, COLORS.GOLD); setBlock(map, EX, HY - 0.5, HZ + 2, COLORS.GOLD);
            setBlock(map, EX - 1, HY + 0.5, HZ + 1, COLORS.BLACK); setBlock(map, EX + 1, HY + 0.5, HZ + 1, COLORS.BLACK);
            setBlock(map, EX - 1, EY, EZ, COLORS.TALON); setBlock(map, EX + 1, EY, EZ, COLORS.TALON);
        }
        buildMiniEagle(-10, 2, false);
        buildMiniEagle(10, -2, true);
        return Array.from(map.values());
    },

    Dragon: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const DY = CONFIG.FLOOR_Y + 1;
        for (let i = 0; i < 15; i++) {
            const angle = i * 0.3;
            const tx = -Math.sin(angle) * (i * 0.5);
            const tz = -i * 0.8 - 2;
            const ty = DY + Math.sin(i * 0.5) * 1.5 + 2;
            generateSphere(map, tx, ty, tz, 1.6 - (i * 0.08), COLORS.GREEN);
            if (i % 3 === 0) setBlock(map, tx, ty + 1.8, tz, COLORS.GOLD);
        }
        generateSphere(map, 0, DY + 5, 0, 3.8, COLORS.GREEN, 1.2);
        for (let y = DY + 3; y <= DY + 7; y++) {
            for (let x = -1; x <= 1; x++) {
                setBlock(map, x, y, 3, COLORS.GOLD);
            }
        }
        for (let wing of [-1, 1]) {
            for (let wx = 1; wx <= 7; wx++) {
                const wy = DY + 6 + (wx * 0.3);
                const wz = -wx * 0.4;
                setBlock(map, wing * wx, wy, wz, COLORS.GREEN);
                setBlock(map, wing * wx, wy - 1, wz, COLORS.GREEN);
                setBlock(map, wing * wx, wy - 2, wz + 1, COLORS.GOLD);
                setBlock(map, wing * (wx + 0.5), wy + 1, wz, COLORS.GOLD);
            }
        }
        for (let ny = 0; ny < 5; ny++) {
            generateSphere(map, 0, DY + 8 + ny, 1 + ny * 0.4, 2.0 - ny * 0.1, COLORS.GREEN);
        }
        const HY = DY + 13, HZ = 3;
        generateSphere(map, 0, HY, HZ, 2.5, COLORS.GREEN);
        generateSphere(map, 0, HY - 0.5, HZ + 2.5, 1.5, COLORS.GREEN);
        setBlock(map, -1.2, HY + 0.8, HZ + 1.2, COLORS.GOLD);
        setBlock(map, 1.2, HY + 0.8, HZ + 1.2, COLORS.GOLD);
        setBlock(map, -1.2, HY + 0.8, HZ + 1.8, COLORS.BLACK);
        setBlock(map, 1.2, HY + 0.8, HZ + 1.8, COLORS.BLACK);
        setBlock(map, -1.2, HY + 2.5, HZ - 0.5, COLORS.GOLD); setBlock(map, -1.5, HY + 3.5, HZ - 1.2, COLORS.GOLD);
        setBlock(map, 1.2, HY + 2.5, HZ - 0.5, COLORS.GOLD); setBlock(map, 1.5, HY + 3.5, HZ - 1.2, COLORS.GOLD);
        setBlock(map, 0, HY - 0.5, HZ + 4, COLORS.RED);
        setBlock(map, -0.5, HY - 0.3, HZ + 5, COLORS.ORANGE); setBlock(map, 0.5, HY - 0.3, HZ + 5, COLORS.RED);
        setBlock(map, 0, HY - 0.2, HZ + 6, COLORS.YELLOW);
        return Array.from(map.values());
    },

    Robot: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const RY = CONFIG.FLOOR_Y + 1;
        for (let y = 0; y < 6; y++) {
            for (let x of [-3, 3]) {
                for (let z of [-1, 0, 1]) {
                    setBlock(map, x, RY + y, z, y === 0 ? COLORS.DARK_GRAY : COLORS.GRAY);
                }
            }
        }
        const TY = RY + 6;
        for (let x = -5; x <= 5; x++) {
            for (let y = 0; y <= 7; y++) {
                for (let z = -2; z <= 2; z++) {
                    const isEdge = Math.abs(x) === 5 || y === 0 || y === 7 || Math.abs(z) === 2;
                    setBlock(map, x, TY + y, z, isEdge ? COLORS.DARK_GRAY : COLORS.LIGHT_GRAY);
                }
            }
        }
        for (let x = -1; x <= 1; x++) {
            for (let y = 3; y <= 5; y++) {
                setBlock(map, x, TY + y, 3, COLORS.RED);
            }
        }
        for (let side of [-1, 1]) {
            generateSphere(map, side * 6.5, TY + 6, 0, 1.5, COLORS.DARK_GRAY);
            for (let ay = 0; ay < 6; ay++) {
                setBlock(map, side * 6.5, TY + 5 - ay, 0, COLORS.GRAY);
                setBlock(map, side * 6.5, TY + 5 - ay, 1, COLORS.GRAY);
            }
            setBlock(map, side * 6.5, TY - 1, 0, COLORS.GOLD);
            setBlock(map, side * 7.5, TY - 2, 0, COLORS.GOLD);
            setBlock(map, side * 5.5, TY - 2, 0, COLORS.GOLD);
        }
        const HY = TY + 8;
        for (let x = -3; x <= 3; x++) {
            for (let y = 0; y <= 4; y++) {
                for (let z = -2; z <= 2; z++) {
                    setBlock(map, x, HY + y, z, COLORS.LIGHT_GRAY);
                }
            }
        }
        for (let x = -2; x <= 2; x++) {
            setBlock(map, x, HY + 2, 3, COLORS.CYAN);
        }
        setBlock(map, -4, HY + 2, 0, COLORS.YELLOW);
        setBlock(map, 4, HY + 2, 0, COLORS.YELLOW);
        setBlock(map, 0, HY + 5, 0, COLORS.DARK_GRAY);
        setBlock(map, 0, HY + 6, 0, COLORS.DARK_GRAY);
        setBlock(map, 0, HY + 7, 0, COLORS.RED);
        return Array.from(map.values());
    },

    Castle: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1;
        for (let x = -9; x <= 9; x++) {
            for (let z = -9; z <= 9; z++) {
                setBlock(map, x, CY, z, COLORS.STONE);
            }
        }
        for (let x = -8; x <= 8; x++) {
            for (let z = -8; z <= 8; z++) {
                if (Math.abs(x) === 8 || Math.abs(z) === 8) {
                    for (let y = 1; y <= 5; y++) {
                        if (z === 8 && Math.abs(x) <= 2 && y <= 3) continue;
                        setBlock(map, x, CY + y, z, COLORS.GRAY);
                    }
                    if ((x + z) % 2 === 0) {
                        setBlock(map, x, CY + 6, z, COLORS.GRAY);
                    }
                }
            }
        }
        const corners = [[-8, -8], [8, -8], [-8, 8], [8, 8]];
        corners.forEach(([tx, tz]) => {
            for (let y = 1; y <= 9; y++) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        setBlock(map, tx + dx, CY + y, tz + dz, COLORS.DARK_GRAY);
                    }
                }
            }
            for (let dx of [-1, 1]) {
                for (let dz of [-1, 1]) {
                    setBlock(map, tx + dx, CY + 10, tz + dz, COLORS.ROOF_RED);
                }
            }
            setBlock(map, tx, CY + 10, tz, COLORS.GOLD);
        });
        for (let y = 1; y <= 12; y++) {
            for (let x = -3; x <= 3; x++) {
                for (let z = -3; z <= 3; z++) {
                    if (Math.abs(x) === 3 || Math.abs(z) === 3) {
                        setBlock(map, x, CY + y, z, COLORS.STONE);
                    }
                }
            }
        }
        for (let fy = 13; fy <= 16; fy++) setBlock(map, 0, CY + fy, 0, COLORS.WOOD);
        for (let fx = 1; fx <= 3; fx++) {
            setBlock(map, fx, CY + 15, 0, COLORS.RED);
            setBlock(map, fx, CY + 16, 0, COLORS.RED);
        }
        return Array.from(map.values());
    },

    Spaceship: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const SY = CONFIG.FLOOR_Y + 5;
        for (let z = -10; z <= 8; z++) {
            const width = Math.max(1, Math.floor(4 - Math.abs(z) * 0.3));
            for (let x = -width; x <= width; x++) {
                for (let y = -1; y <= 2; y++) {
                    if (x * x + y * y <= (width + 0.5) ** 2) {
                        setBlock(map, x, SY + y, z, z < -6 ? COLORS.CYAN : COLORS.WHITE);
                    }
                }
            }
        }
        for (let z = -6; z <= -1; z++) {
            for (let x = -1; x <= 1; x++) {
                setBlock(map, x, SY + 3, z, COLORS.SKY_BLUE);
            }
        }
        for (let wx = 1; wx <= 12; wx++) {
            const wzStart = Math.floor(wx * 0.6) - 2;
            const wzEnd = 6;
            for (let wz = wzStart; wz <= wzEnd; wz++) {
                setBlock(map, wx, SY, wz, COLORS.DARK_GRAY);
                setBlock(map, -wx, SY, wz, COLORS.DARK_GRAY);
                if (wz === wzEnd) {
                    setBlock(map, wx, SY + 1, wz, COLORS.BLUE);
                    setBlock(map, -wx, SY + 1, wz, COLORS.BLUE);
                }
            }
            if (wx === 12) {
                setBlock(map, 12, SY, wzStart - 1, COLORS.RED);
                setBlock(map, -12, SY, wzStart - 1, COLORS.RED);
            }
        }
        for (let side of [-2, 2]) {
            for (let z = 6; z <= 10; z++) {
                setBlock(map, side, SY, z, COLORS.BLACK);
                setBlock(map, side, SY + 1, z, COLORS.BLACK);
            }
            setBlock(map, side, SY, 11, COLORS.ORANGE);
            setBlock(map, side, SY, 12, COLORS.YELLOW);
            setBlock(map, side, SY + 1, 11, COLORS.CYAN);
        }
        return Array.from(map.values());
    },

    Car: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1;
        const wheelCoords = [[-4, -5], [4, -5], [-4, 5], [4, 5]];
        wheelCoords.forEach(([wx, wz]) => {
            for (let y = 0; y <= 2; y++) {
                for (let z = -1; z <= 1; z++) {
                    setBlock(map, wx, CY + y, wz + z, COLORS.DARK_GRAY);
                }
            }
            setBlock(map, wx + (wx > 0 ? 0.2 : -0.2), CY + 1, wz, COLORS.LIGHT_GRAY);
        });
        for (let x = -3; x <= 3; x++) {
            for (let z = -8; z <= 8; z++) {
                for (let y = 1; y <= 3; y++) {
                    setBlock(map, x, CY + y, z, COLORS.RED);
                }
            }
        }
        for (let x = -2; x <= 2; x++) {
            for (let z = -3; z <= 3; z++) {
                for (let y = 4; y <= 6; y++) {
                    setBlock(map, x, CY + y, z, COLORS.RED);
                }
            }
        }
        for (let x = -2; x <= 2; x++) {
            setBlock(map, x, CY + 4, -4, COLORS.SKY_BLUE);
            setBlock(map, x, CY + 5, -4, COLORS.SKY_BLUE);
            setBlock(map, x, CY + 4, 4, COLORS.SKY_BLUE);
            setBlock(map, x, CY + 5, 4, COLORS.SKY_BLUE);
        }
        for (let z = -2; z <= 2; z++) {
            setBlock(map, -3, CY + 4, z, COLORS.SKY_BLUE);
            setBlock(map, 3, CY + 4, z, COLORS.SKY_BLUE);
        }
        setBlock(map, -2, CY + 2, -9, COLORS.YELLOW); setBlock(map, 2, CY + 2, -9, COLORS.YELLOW);
        setBlock(map, -2, CY + 2, 9, COLORS.BLACK); setBlock(map, 2, CY + 2, 9, COLORS.BLACK);
        for (let x = -3; x <= 3; x++) {
            setBlock(map, x, CY + 5, 8, COLORS.BLACK);
        }
        setBlock(map, -3, CY + 4, 8, COLORS.RED); setBlock(map, 3, CY + 4, 8, COLORS.RED);
        return Array.from(map.values());
    },

    Panda: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const PY = CONFIG.FLOOR_Y + 1;
        generateSphere(map, -2.5, PY + 1, 2, 1.8, COLORS.BLACK);
        generateSphere(map, 2.5, PY + 1, 2, 1.8, COLORS.BLACK);
        generateSphere(map, 0, PY + 4, 0, 4.0, COLORS.WHITE, 1.1);
        for (let y = PY + 3; y <= PY + 6; y++) {
            for (let z = -2; z <= 2; z++) {
                setBlock(map, -3.5, y, z, COLORS.BLACK);
                setBlock(map, 3.5, y, z, COLORS.BLACK);
            }
        }
        const HY = PY + 9;
        generateSphere(map, 0, HY, 0, 3.5, COLORS.WHITE, 0.9);
        generateSphere(map, -2.8, HY + 3, -0.5, 1.4, COLORS.BLACK);
        generateSphere(map, 2.8, HY + 3, -0.5, 1.4, COLORS.BLACK);
        setBlock(map, -1.5, HY + 0.5, 3.0, COLORS.BLACK);
        setBlock(map, 1.5, HY + 0.5, 3.0, COLORS.BLACK);
        setBlock(map, -1.5, HY + 0.8, 3.2, COLORS.WHITE);
        setBlock(map, 1.5, HY + 0.8, 3.2, COLORS.WHITE);
        setBlock(map, 0, HY - 0.5, 3.2, COLORS.BLACK);
        for (let y = PY; y <= PY + 9; y++) {
            setBlock(map, 2.2, y, 3, COLORS.GREEN);
            if (y % 3 === 0) setBlock(map, 2.5, y, 3.5, COLORS.LIME);
        }
        return Array.from(map.values());
    },

    Rocket: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const RY = CONFIG.FLOOR_Y + 4;
        for (let y = 0; y <= 14; y++) {
            const r = y < 2 ? 3.5 : (y > 10 ? 3.0 - (y - 10) * 0.5 : 3.2);
            generateSphere(map, 0, RY + y, 0, r, COLORS.WHITE, 0.5);
        }
        for (let y = 15; y <= 20; y++) {
            const r = Math.max(0.5, 2.5 - (y - 15) * 0.4);
            generateSphere(map, 0, RY + y, 0, r, COLORS.RED, 0.6);
        }
        generateSphere(map, 0, RY + 9, 3, 1.8, COLORS.CYAN);
        generateSphere(map, 0, RY + 9, 2.8, 2.1, COLORS.LIGHT_GRAY);
        const finDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        finDirs.forEach(([dx, dz]) => {
            for (let fy = 0; fy <= 6; fy++) {
                const dist = 3 + (6 - fy) * 0.8;
                for (let d = 3; d <= dist; d++) {
                    setBlock(map, dx * d, RY + fy, dz * d, COLORS.RED);
                }
            }
        });
        for (let fy = -1; fy >= -5; fy--) {
            const r = Math.abs(fy) * 0.5 + 1;
            const col = fy > -3 ? COLORS.YELLOW : COLORS.ORANGE;
            generateSphere(map, 0, RY + fy, 0, r, col);
        }
        return Array.from(map.values());
    },

    PirateShip: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const SY = CONFIG.FLOOR_Y + 1;
        for (let z = -10; z <= 10; z++) {
            const width = Math.max(1, Math.floor(5 - (Math.abs(z) > 6 ? (Math.abs(z) - 6) * 0.8 : 0)));
            const height = z > 6 || z < -6 ? 5 : 3;
            for (let x = -width; x <= width; x++) {
                for (let y = 1; y <= height; y++) {
                    const isOuter = Math.abs(x) === width || y === 1 || y === height;
                    setBlock(map, x, SY + y, z, isOuter ? COLORS.WOOD : COLORS.DARK);
                }
            }
        }
        for (let z = -10; z <= 10; z++) {
            const width = Math.max(1, Math.floor(5 - (Math.abs(z) > 6 ? (Math.abs(z) - 6) * 0.8 : 0)));
            const height = z > 6 || z < -6 ? 5 : 3;
            setBlock(map, width, SY + height, z, COLORS.GOLD);
            setBlock(map, -width, SY + height, z, COLORS.GOLD);
        }
        const mastZ = [-4, 4];
        mastZ.forEach(mz => {
            for (let my = 3; my <= 16; my++) {
                setBlock(map, 0, SY + my, mz, COLORS.DARK);
            }
            for (let sy = 6; sy <= 13; sy++) {
                const sWidth = Math.floor(5 - Math.abs(sy - 9.5) * 0.5);
                const curve = Math.sin((sy - 6) / 7 * Math.PI) * 1.5;
                for (let sx = -sWidth; sx <= sWidth; sx++) {
                    setBlock(map, sx, SY + sy, mz - curve, COLORS.WHITE);
                }
            }
        });
        for (let fx = 1; fx <= 3; fx++) {
            setBlock(map, fx, SY + 16, 4, COLORS.BLACK);
            setBlock(map, fx, SY + 15, 4, COLORS.BLACK);
        }
        setBlock(map, 2, SY + 15.5, 4.2, COLORS.WHITE);
        return Array.from(map.values());
    },

    TreasureChest: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const TY = CONFIG.FLOOR_Y + 1;
        for (let x = -6; x <= 6; x++) {
            for (let z = -4; z <= 4; z++) {
                for (let y = 0; y <= 5; y++) {
                    const isEdge = Math.abs(x) === 6 || Math.abs(z) === 4 || y === 0 || y === 5;
                    const isCorner = (Math.abs(x) === 6 ? 1 : 0) + (Math.abs(z) === 4 ? 1 : 0) + (y === 0 || y === 5 ? 1 : 0) >= 2;
                    setBlock(map, x, TY + y, z, isCorner ? COLORS.GOLD : (isEdge ? COLORS.DARK : COLORS.WOOD));
                }
            }
        }
        for (let x = -6; x <= 6; x++) {
            for (let l = 0; l <= 5; l++) {
                setBlock(map, x, TY + 5 + l, -4 - l * 0.6, COLORS.WOOD);
                setBlock(map, x, TY + 5 + l, -5 - l * 0.6, COLORS.DARK);
            }
        }
        for (let x = -5; x <= 5; x++) {
            for (let z = -3; z <= 3; z++) {
                for (let y = 4; y <= 7; y++) {
                    if (y === 7 && Math.random() > 0.4) continue;
                    const rand = Math.random();
                    let gemColor = COLORS.GOLD;
                    if (rand > 0.85) gemColor = COLORS.RED;
                    else if (rand > 0.7) gemColor = COLORS.CYAN;
                    else if (rand > 0.55) gemColor = COLORS.GREEN;
                    else if (rand > 0.4) gemColor = COLORS.PURPLE;
                    setBlock(map, x, TY + y, z, gemColor);
                }
            }
        }
        setBlock(map, 0, TY + 3, 5, COLORS.GOLD);
        setBlock(map, 0, TY + 2, 5, COLORS.BLACK);
        return Array.from(map.values());
    },

    House: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const HY = CONFIG.FLOOR_Y + 1;
        for (let x = -7; x <= 7; x++) {
            for (let z = -6; z <= 6; z++) {
                setBlock(map, x, HY, z, COLORS.STONE);
            }
        }
        for (let x = -6; x <= 6; x++) {
            for (let z = -5; z <= 5; z++) {
                if (Math.abs(x) === 6 || Math.abs(z) === 5) {
                    for (let y = 1; y <= 6; y++) {
                        if (z === 5 && Math.abs(x) <= 1 && y <= 4) {
                            setBlock(map, x, HY + y, z, COLORS.WOOD);
                        } else if ((z === 5 || Math.abs(x) === 6) && (y === 3 || y === 4) && Math.abs(x) !== 6 && Math.abs(x) !== 1) {
                            setBlock(map, x, HY + y, z, COLORS.SKY_BLUE);
                        } else {
                            setBlock(map, x, HY + y, z, COLORS.WHITE);
                        }
                    }
                }
            }
        }
        for (let ry = 0; ry <= 4; ry++) {
            const rxMax = 7 - ry;
            for (let x = -rxMax; x <= rxMax; x++) {
                for (let z = -6; z <= 6; z++) {
                    setBlock(map, x, HY + 7 + ry, z, COLORS.ROOF_RED);
                }
            }
        }
        for (let cy = 7; cy <= 12; cy++) {
            setBlock(map, 4, HY + cy, -2, COLORS.DARK_GRAY);
            setBlock(map, 5, HY + cy, -2, COLORS.DARK_GRAY);
        }
        setBlock(map, 4.5, HY + 13, -2, COLORS.LIGHT_GRAY);
        setBlock(map, 5.0, HY + 14, -1.5, COLORS.WHITE);
        setBlock(map, 5.5, HY + 15, -1, COLORS.WHITE);
        generateSphere(map, -4, HY + 1, 6, 1.5, COLORS.GREEN);
        generateSphere(map, 4, HY + 1, 6, 1.5, COLORS.GREEN);
        return Array.from(map.values());
    },

    // --- MEGA MODELS (100,000 to 250,000 BLOCKS) ---

    MegaMetropolis100k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const baseY = CONFIG.FLOOR_Y + 1;
        const gridRadius = 45; // 90x90 base = 8,100 base ground blocks

        // Ground base & road network
        for (let x = -gridRadius; x <= gridRadius; x++) {
            for (let z = -gridRadius; z <= gridRadius; z++) {
                const isRoadX = Math.abs(x % 18) <= 1;
                const isRoadZ = Math.abs(z % 18) <= 1;
                let color = COLORS.DARK_GRAY;
                if (isRoadX || isRoadZ) {
                    color = (x === 0 || z === 0) ? COLORS.YELLOW : COLORS.GRAY;
                } else {
                    color = COLORS.STONE;
                }
                voxels.push({ x, y: baseY, z, color });
            }
        }

        // Generate 25 skyscraper blocks in a 5x5 layout
        const towerSpans = [-36, -18, 0, 18, 36];
        for (let tx of towerSpans) {
            for (let tz of towerSpans) {
                if (Math.abs(tx) <= 2 && Math.abs(tz) <= 2) {
                    // Central Mega Tower (110 blocks high!)
                    const width = 7;
                    const height = 110;
                    for (let y = 1; y <= height; y++) {
                        const curW = y > 80 ? 3 : (y > 50 ? 5 : width);
                        for (let dx = -curW; dx <= curW; dx++) {
                            for (let dz = -curW; dz <= curW; dz++) {
                                const isWall = Math.abs(dx) === curW || Math.abs(dz) === curW;
                                const isWindow = isWall && (y % 3 !== 0) && (dx % 2 !== 0 || dz % 2 !== 0);
                                let c = COLORS.DARK_GRAY;
                                if (isWindow) c = COLORS.CYAN;
                                else if (y === height) c = COLORS.RED;
                                else if (y > 80) c = COLORS.SKY_BLUE;
                                voxels.push({ x: tx + dx, y: baseY + y, z: tz + dz, color: c });
                            }
                        }
                    }
                } else {
                    // Regular Skyscrapers
                    const width = 5;
                    const height = 25 + Math.floor(Math.abs(Math.sin(tx * 3 + tz * 7)) * 45);
                    const roofColor = (tx + tz) % 2 === 0 ? COLORS.ROOF_RED : COLORS.BLUE;

                    for (let y = 1; y <= height; y++) {
                        for (let dx = -width; dx <= width; dx++) {
                            for (let dz = -width; dz <= width; dz++) {
                                const isEdge = Math.abs(dx) === width || Math.abs(dz) === width;
                                const isWindow = isEdge && (y % 2 === 0);
                                const c = isWindow ? COLORS.SKY_BLUE : (y === height ? roofColor : COLORS.DARK);
                                voxels.push({ x: tx + dx, y: baseY + y, z: tz + dz, color: c });
                            }
                        }
                    }
                    // Spire antenna on top
                    for (let sy = 1; sy <= 10; sy++) {
                        voxels.push({ x: tx, y: baseY + height + sy, z: tz, color: COLORS.RED });
                    }
                }
            }
        }
        return voxels;
    },

    VolcanoIsland120k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const baseY = CONFIG.FLOOR_Y + 1;
        const radius = 55;

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const dist2 = x * x + z * z;
                if (dist2 > radius * radius) continue;
                const dist = Math.sqrt(dist2);

                // Mountain height profile with crater at top
                const maxH = 50;
                let h = 0;
                if (dist < 12) {
                    // Crater depression
                    h = maxH - Math.pow(12 - dist, 1.2) * 1.5;
                } else {
                    // Slopes
                    h = Math.max(1, (1 - (dist - 12) / (radius - 12)) * maxH);
                }

                const height = Math.floor(h);
                for (let y = 0; y <= height; y++) {
                    let col = COLORS.STONE;
                    if (dist < 10 && y >= height - 2) {
                        col = COLORS.RED; // Magma pool inside crater
                    } else if (dist < 14 && y === height && x > -3 && x < 3) {
                        col = COLORS.ORANGE; // Lava stream
                    } else if (y === height && dist > 35) {
                        col = COLORS.GREEN; // Island greenery at base
                    } else if (y === 0 && dist > 42) {
                        col = COLORS.CYAN; // Ocean water ring
                    } else if (y > 35) {
                        col = COLORS.DARK_GRAY; // Volcanic ash rock
                    }
                    voxels.push({ x, y: baseY + y, z, color: col });
                }
            }
        }
        return voxels;
    },

    SphereMatrix100k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const R = 32;

        // Giant 3D Solid/Hollow Geodesic Sphere Matrix
        for (let x = -R; x <= R; x++) {
            for (let y = -R; y <= R; y++) {
                for (let z = -R; z <= R; z++) {
                    const d2 = x * x + y * y + z * z;
                    const rInner = R - 6;
                    
                    // Outer shell OR Inner nucleus OR Orbital Ring
                    const isShell = d2 <= R * R && d2 >= rInner * rInner;
                    const isCore = d2 <= 8 * 8;
                    const isRing = Math.abs(y) <= 1 && d2 <= 48 * 48 && d2 >= 42 * 42;

                    if (isShell || isCore || isRing) {
                        let color = COLORS.CYAN;
                        if (isCore) color = COLORS.GOLD;
                        else if (isRing) color = COLORS.PURPLE;
                        else if ((x + y + z) % 4 === 0) color = COLORS.SKY_BLUE;
                        else if (x > 0 && y > 0) color = COLORS.MAGENTA;
                        else color = COLORS.BLUE;

                        voxels.push({ x, y: y + R + 2, z, color });
                    }
                }
            }
        }
        return voxels;
    },

    TitanColossus150k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const baseY = CONFIG.FLOOR_Y + 1;

        // Base Pedestal (40x40 x 10)
        for (let x = -20; x <= 20; x++) {
            for (let z = -20; z <= 20; z++) {
                for (let y = 0; y <= 8; y++) {
                    const isEdge = Math.abs(x) === 20 || Math.abs(z) === 20 || y === 0 || y === 8;
                    voxels.push({ x, y: baseY + y, z, color: isEdge ? COLORS.DARK_GRAY : COLORS.STONE });
                }
            }
        }

        const PY = baseY + 9;

        // Giant Legs (x: -12..-4 & 4..12, y: 0..35)
        for (let leg of [-1, 1]) {
            const lx = leg * 8;
            for (let x = -4; x <= 4; x++) {
                for (let z = -5; z <= 5; z++) {
                    for (let y = 0; y <= 35; y++) {
                        const col = y < 5 ? COLORS.DARK : (y > 30 ? COLORS.GOLD : COLORS.GRAY);
                        voxels.push({ x: lx + x, y: PY + y, z, color: col });
                    }
                }
            }
        }

        // Giant Torso (x: -16..16, y: 36..70, z: -8..8)
        for (let x = -16; x <= 16; x++) {
            for (let z = -8; z <= 8; z++) {
                for (let y = 36; y <= 70; y++) {
                    const isHeart = Math.abs(x) <= 3 && Math.abs(z - 8) <= 1 && y >= 50 && y <= 56;
                    const isArmor = Math.abs(x) > 12 || y > 62;
                    let c = COLORS.GRAY;
                    if (isHeart) c = COLORS.CYAN;
                    else if (isArmor) c = COLORS.GOLD;
                    else if (Math.abs(x) <= 6) c = COLORS.DARK_GRAY;
                    voxels.push({ x, y: PY + y, z, color: c });
                }
            }
        }

        // Head & Horns (y: 71..88)
        for (let x = -7; x <= 7; x++) {
            for (let z = -7; z <= 7; z++) {
                for (let y = 71; y <= 85; y++) {
                    const isEye = (x === -3 || x === 3) && z === 7 && (y === 78 || y === 79);
                    voxels.push({ x, y: PY + y, z, color: isEye ? COLORS.RED : COLORS.LIGHT_GRAY });
                }
            }
        }

        // Giant Extended Arms holding a glowing orb!
        for (let side of [-1, 1]) {
            for (let ax = 17; ax <= 32; ax++) {
                for (let ay = 50; ay <= 60; ay++) {
                    for (let az = -6; az <= 6; az++) {
                        voxels.push({ x: side * ax, y: PY + ay, z: az, color: COLORS.GOLD });
                    }
                }
            }
        }

        return voxels;
    },

    GalaxyCluster200k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const count = 200000;
        const Y = CONFIG.FLOOR_Y + 30;

        for (let i = 0; i < count; i++) {
            // Spiral distribution
            const arm = i % 4; // 4 spiral arms
            const dist = Math.pow(Math.random(), 0.7) * 55;
            const angle = (dist * 0.15) + (arm * Math.PI / 2) + (Math.random() - 0.5) * 0.3;

            const x = Math.cos(angle) * dist + (Math.random() - 0.5) * (dist * 0.15);
            const z = Math.sin(angle) * dist + (Math.random() - 0.5) * (dist * 0.15);
            const y = Y + (Math.random() - 0.5) * (18 - dist * 0.25);

            let color = COLORS.CYAN;
            if (dist < 8) color = COLORS.WHITE;
            else if (dist < 18) color = COLORS.GOLD;
            else if (arm === 0) color = COLORS.CYAN;
            else if (arm === 1) color = COLORS.MAGENTA;
            else if (arm === 2) color = COLORS.PURPLE;
            else color = COLORS.SKY_BLUE;

            voxels.push({
                x: +x.toFixed(2),
                y: +y.toFixed(2),
                z: +z.toFixed(2),
                color
            });
        }
        return voxels;
    },

    CyberCity250k: (): VoxelData[] => {
        const voxels: VoxelData[] = [];
        const baseY = CONFIG.FLOOR_Y + 1;
        const R = 60; // 120x120 base grid = 14,400 ground tiles

        for (let x = -R; x <= R; x += 2) {
            for (let z = -R; z <= R; z += 2) {
                const distFromCenter = Math.sqrt(x * x + z * z);
                if (distFromCenter > R) continue;

                // Height scales up towards center
                const maxH = Math.max(10, Math.floor((1 - distFromCenter / R) * 90));
                const buildingColor = distFromCenter < 20 ? COLORS.CYAN : ((x + z) % 4 === 0 ? COLORS.DARK_GRAY : COLORS.BLUE);

                for (let y = 0; y <= maxH; y += 2) {
                    const isWindow = (y % 4 === 0) && (x % 4 === 0 || z % 4 === 0);
                    const col = isWindow ? COLORS.YELLOW : buildingColor;
                    
                    voxels.push({ x, y: baseY + y, z, color: col });
                    // Add neighboring sub-voxel for high density
                    voxels.push({ x: x + 1, y: baseY + y, z, color: col });
                    voxels.push({ x, y: baseY + y + 1, z, color: col });
                }
            }
        }
        return voxels;
    }
};
