#!/usr/bin/env python3
"""Hornea la oclusión ambiental (AO) por vértice en las mallas del visor del hígado.

Por qué: los visores de anatomía que mejor se ven (Complete Anatomy) llevan el detalle
horneado en la malla, y en tiempo real no cuesta nada. Sin AO, los vasos y las lesiones dentro
del hígado translúcido salen planos y no se sabe qué va delante de qué (investigación de
render, 27-sep-2026, 00_FUENTE-DE-VERDAD/07 · Marca).

Qué hace: voxeliza a 1 mm todas las piezas opacas (vasos, porta, cava, vesícula, lesiones) y,
desde cada vértice, lanza rayos por el hemisferio de su normal. La fracción que escapa es la
AO, que se escribe como color gris de vértice (red=green=blue) en el propio PLY. **Las
posiciones no se tocan**: las lesiones siguen donde estaban y test:mallas-3d lo vigila.
La cápsula del hígado no se hornea (es la carcasa translúcida; si ocluyera, todo lo de dentro
saldría negro) ni ocluye.

Uso (numpy + scipy):  python3 scripts/hornea-ao.py public/lesiones/higado   (o .../mama)
Idempotente: si el PLY ya lleva color, se recalcula desde la geometría y se reescribe.
"""
import json
import os
import re
import sys

import numpy as np
from scipy import ndimage

VOX = 1.0          # mm por vóxel
RAYOS = 32
ALCANCE = 18.0     # mm: más lejos no oscurece (si no, el centro del árbol vascular sale negro)
PISO = 0.25        # el rincón más ocluido no baja de aquí: se oscurece, no desaparece


def lee(ruta):
    b = open(ruta, "rb").read()
    i = b.index(b"end_header\n") + len(b"end_header\n")
    cab = b[:i].decode("latin1")
    assert "binary_little_endian" in cab, ruta
    nv = int(re.search(r"element vertex (\d+)", cab).group(1))
    nf = int(re.search(r"element face (\d+)", cab).group(1))
    props = re.findall(r"property (\w+) (\w+)", cab.split("element face")[0])
    tipos = {"float": "<f4", "float32": "<f4", "uchar": "u1", "uint8": "u1"}
    dt = np.dtype([(n, tipos[t]) for t, n in props])
    vert = np.frombuffer(b, dt, nv, i)
    V = np.stack([vert["x"], vert["y"], vert["z"]], 1).astype(float)
    F = np.frombuffer(b, np.dtype([("n", "u1"), ("i", "<i4", 3)]), nf, i + nv * dt.itemsize)
    assert (F["n"] == 3).all()
    return V, F["i"].astype(np.int64)


def escribe(ruta, V, F, gris):
    nv, nf = len(V), len(F)
    cab = ("ply\nformat binary_little_endian 1.0\nelement vertex %d\n"
           "property float x\nproperty float y\nproperty float z\n"
           "property uchar red\nproperty uchar green\nproperty uchar blue\n"
           "element face %d\nproperty list uchar int vertex_indices\nend_header\n" % (nv, nf))
    vdt = np.dtype([("x", "<f4"), ("y", "<f4"), ("z", "<f4"), ("r", "u1"), ("g", "u1"), ("b", "u1")])
    v = np.zeros(nv, vdt)
    v["x"], v["y"], v["z"] = V[:, 0], V[:, 1], V[:, 2]
    g = np.clip(np.round(gris * 255), 0, 255).astype("u1")
    v["r"] = v["g"] = v["b"] = g
    f = np.zeros(nf, np.dtype([("n", "u1"), ("i", "<i4", 3)]))
    f["n"], f["i"] = 3, F
    open(ruta, "wb").write(cab.encode("latin1") + v.tobytes() + f.tobytes())


def normales(V, F):
    n = np.zeros_like(V)
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    for k in range(3):
        np.add.at(n, F[:, k], fn)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)


def voxeliza(piezas, lo, forma):
    """Ocupación sólida: superficie muestreada y rellena por pieza (tubos y lesiones cerrados)."""
    occ = np.zeros(forma, bool)
    for V, F in piezas:
        sup = np.zeros(forma, bool)
        a, b, c = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
        lado = np.maximum(np.linalg.norm(b - a, axis=1), np.linalg.norm(c - a, axis=1))
        n = int(np.clip(np.ceil(lado.max() / (VOX * 0.5)), 2, 12))
        for u in np.linspace(0, 1, n):
            for w in np.linspace(0, 1 - u, max(2, int(n * (1 - u)) + 1)):
                p = a + u * (b - a) + w * (c - a)
                idx = np.floor((p - lo) / VOX).astype(int)
                sup[idx[:, 0], idx[:, 1], idx[:, 2]] = True
        occ |= ndimage.binary_fill_holes(sup)
    return occ


def hemisferio(n, rng):
    """Direcciones con reparto coseno alrededor de cada normal (RAYOS por vértice)."""
    u1, u2 = rng.random((2, RAYOS))
    r, th = np.sqrt(u1), 2 * np.pi * u2
    loc = np.stack([r * np.cos(th), r * np.sin(th), np.sqrt(1 - u1)], 1)      # (R,3)
    t = np.where(np.abs(n[:, :1]) < 0.9, [[1.0, 0, 0]], [[0, 1.0, 0]])
    ex = np.cross(n, t); ex /= np.linalg.norm(ex, axis=1, keepdims=True)
    ey = np.cross(n, ex)
    return (loc[None, :, :1] * ex[:, None] + loc[None, :, 1:2] * ey[:, None]
            + loc[None, :, 2:] * n[:, None])                                  # (V,R,3)


def hacia_fuera(V, n, occ, lo):
    """Las mallas no traen un sentido de caras fiable: se voltea la normal que apunta al propio
    sólido (el punto a 2 mm por su lado cae en vóxel ocupado y por el contrario no)."""
    def ocupado(p):
        idx = np.clip(np.floor((p - lo) / VOX).astype(int), 0, np.array(occ.shape) - 1)
        return occ[idx[:, 0], idx[:, 1], idx[:, 2]]
    dentro = ocupado(V + n * 2.0) & ~ocupado(V - n * 2.0)
    n = n.copy(); n[dentro] *= -1
    return n


def ao(V, n, occ, lo, rng):
    n = hacia_fuera(V, n, occ, lo)
    dirs = hemisferio(n, rng)
    libre = np.ones(dirs.shape[:2], bool)
    pasos = np.arange(1.5, ALCANCE, VOX * 0.9)
    for s in pasos:
        p = V[:, None, :] + n[:, None, :] * 1.6 + dirs * s
        idx = np.floor((p - lo) / VOX).astype(int)
        dentro = np.all((idx >= 0) & (idx < occ.shape), axis=2)
        idx = np.where(dentro[..., None], idx, 0)
        golpe = dentro & occ[idx[..., 0], idx[..., 1], idx[..., 2]]
        libre &= ~golpe
    # curva ^2: el color de vértice es lineal y en pantalla (sRGB) una AO de 0,85 casi no se ve
    return PISO + (1 - PISO) * libre.mean(1) ** 2


GROSOR_MAX = 55.0  # mm: a partir de aquí el tejido ya no deja pasar luz (translucidez = 0)


def delgadez(V, F, lo_h, occ_h):
    """Grosor del hígado bajo cada vértice de la cápsula, medido hacia dentro por su normal, y
    devuelto como «delgadez» 0-1 (1 = borde fino, por donde pasa la luz). Es el mapa de grosor
    de la translucidez barata (Barré-Brisebois, GDC 2011): el visor lo usa para que los bordes
    finos del hígado brillen cálidos y lo grueso quede más opaco."""
    n = hacia_fuera(V, normales(V, F), occ_h, lo_h)
    d = np.full(len(V), GROSOR_MAX)
    fuera_ya = np.zeros(len(V), bool)
    for s in np.arange(1.0, GROSOR_MAX, VOX * 0.9):
        p = V - n * s
        idx = np.floor((p - lo_h) / VOX).astype(int)
        dentro = np.all((idx >= 0) & (idx < occ_h.shape), axis=1)
        idx = np.where(dentro[:, None], idx, 0)
        solido = dentro & occ_h[idx[:, 0], idx[:, 1], idx[:, 2]]
        sale = ~solido & ~fuera_ya & (s > 2.0)
        d[sale] = s
        fuera_ya |= sale
    return np.clip(1 - d / GROSOR_MAX, 0, 1)


def main(carpeta):
    esc = json.load(open(os.path.join(carpeta, "escena.json"), encoding="utf-8"))
    # opacas: todo lo que va dentro de la cápsula y no es tejido difuso (el fibroglandular de la
    # mama es una nube translúcida: ni se hornea ni ocluye)
    nombres = [esc["mallas"][k] for k in ("porta", "vasos", "vci", "vesicula") if esc["mallas"].get(k)]
    nombres += [L["malla"] for L in esc["lesiones"]]
    piezas = {f: lee(os.path.join(carpeta, f)) for f in nombres}
    todos = np.concatenate([V for V, _ in piezas.values()])
    lo = todos.min(0) - 4 * VOX
    forma = tuple(np.ceil((todos.max(0) + 4 * VOX - lo) / VOX).astype(int))
    occ = voxeliza(piezas.values(), lo, forma)
    rng = np.random.default_rng(27)   # determinista: mismo resultado en cada horneado
    for f, (V, F) in piezas.items():
        g = ao(V, normales(V, F), occ, lo, rng)
        escribe(os.path.join(carpeta, f), V, F, g)
        print("%-14s %6d vértices · AO media %.2f · mín %.2f" % (f, len(V), g.mean(), g.min()))
    # la cápsula: su propio sólido, y en el color va la delgadez (no AO)
    fh = esc["mallas"].get("higado") or esc["mallas"].get("mama")   # la cápsula de cada órgano
    Vh, Fh = lee(os.path.join(carpeta, fh))
    lo_h = Vh.min(0) - 4 * VOX
    forma_h = tuple(np.ceil((Vh.max(0) + 4 * VOX - lo_h) / VOX).astype(int))
    occ_h = voxeliza([(Vh, Fh)], lo_h, forma_h)
    t = delgadez(Vh, Fh, lo_h, occ_h)
    escribe(os.path.join(carpeta, fh), Vh, Fh, t)
    print("%-14s %6d vértices · delgadez media %.2f · máx %.2f" % (fh, len(Vh), t.mean(), t.max()))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/lesiones/higado")
