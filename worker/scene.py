"""Fixed ManimGL templates driven by BEATS_FILE (JSON list of {visual, duration, source}).

Render: BEATS_FILE=beats.json manimgl worker/scene.py BeatScene -w -m --video_dir DIR --file_name silent
No LLM-written code runs here: the LLM only fills the JSON fields.
"""
import json
import os
import re
import textwrap

from manimlib import *

TXN_COLORS = [BLUE_C, GREEN_C, ORANGE, PURPLE_B, TEAL_C, MAROON_B]
OP = re.compile(r"^([rw])(\d+)\((\w+)\)$")
FONT = "Inter"


def T(text, **kw):
    return Text(text, font=FONT, **kw)


def op_tex(op, **kw):
    m = OP.match(op.replace(" ", ""))
    if not m:
        return T(op, font_size=kw.get("font_size", 36))
    return Tex(rf"{m[1]}_{{{m[2]}}}({m[3]})", **kw)


def txn_of(op):
    m = OP.match(op.replace(" ", ""))
    return int(m[2]) if m else 0


def heading(text):
    return T(text, font_size=44, color=YELLOW_B).to_edge(UP, buff=0.6) if text else VGroup()


def fit(mob, width=12.0, height=5.2, grow=False):
    """Shrink to the box; with grow=True also enlarge small content to fill it."""
    k = min(width / max(mob.get_width(), 1e-6), height / max(mob.get_height(), 1e-6))
    if k < 1 or grow:
        mob.scale(min(k, 2.2))
    return mob


def place(body, head):
    """Center body in the area under the heading."""
    body.move_to(DOWN * 0.45 if len(head) else ORIGIN)
    return body


class BeatScene(Scene):
    def construct(self):
        beats = json.load(open(os.environ["BEATS_FILE"]))
        self.clock = 0.0
        current = VGroup()
        target = 0.0
        for beat in beats:
            target += beat["duration"]
            v = beat["visual"]
            build = getattr(self, "v_" + v.get("type", "bullets"), self.v_bullets)
            try:
                group, reveal = build(v)
            except Exception as e:  # ponytail: bad visual JSON -> plain heading, never a failed render
                print("visual fallback:", e)
                group, reveal = self.v_title({"text": v.get("heading") or v.get("text") or ""})
            source = T(beat.get("source", ""), font_size=22, color=GREY_B).to_corner(DR, buff=0.3)
            group.add(source)
            budget = max(0.5, target - self.clock - 0.3)
            self.play_for(min(0.6, budget / 4), FadeOut(current), FadeIn(source))
            for anims, share in reveal:
                self.play_for(max(0.2, share * (target - self.clock) * 0.8), *anims)
            self.wait_until(target)
            current = group

    def play_for(self, t, *anims):
        self.play(*anims, run_time=t)
        self.clock += t

    def wait_until(self, target):
        if target > self.clock:
            self.wait(target - self.clock)
        self.clock = max(self.clock, target)

    # Each template returns (group, [(animations, share_of_remaining_time), ...]).

    def v_title(self, v):
        title = T(v.get("text", ""), font_size=60)
        fit(title)
        sub = T(v.get("subtitle", ""), font_size=34, color=GREY_A).next_to(title, DOWN, buff=0.4)
        g = VGroup(title, sub).center()
        return g, [([Write(title)], 0.3), ([FadeIn(sub, UP)], 0.15)]

    def v_bullets(self, v):
        head = heading(v.get("heading", ""))
        items = VGroup(*[
            VGroup(Dot(radius=0.07, color=YELLOW_B),
                   T("\n".join(textwrap.wrap(item, 40)), font_size=40, alignment="LEFT")).arrange(RIGHT, buff=0.35)
            for item in v.get("items", [])[:5]
        ]).arrange(DOWN, aligned_edge=LEFT, buff=0.6)
        place(fit(items, 11.5, 5.0), head)
        n = max(1, len(items))
        return VGroup(head, items), [([Write(head)], 0.1)] + [([FadeIn(i, RIGHT * 0.3)], 0.5 / n) for i in items]

    def v_formula(self, v):
        head = heading(v.get("heading", ""))
        tex = place(fit(Tex(v.get("latex", ""), font_size=96), 11.5, 4.5), head)
        return VGroup(head, tex), [([Write(head)], 0.1), ([Write(tex)], 0.3)]

    def v_schedule(self, v):
        head = heading(v.get("heading", ""))
        ops = v.get("ops", [])
        txns = sorted({txn_of(o) for o in ops})
        col_w = min(1.6, 10.5 / max(1, len(ops)))
        rows = {t: i for i, t in enumerate(txns)}
        origin = np.array([-col_w * (len(ops) - 1) / 2 + 0.6, 0.9 * (len(txns) - 1) / 2 - 0.2, 0])
        labels = VGroup(*[
            T(f"T{t}", font_size=34, color=TXN_COLORS[i % 6]).move_to(origin + LEFT * 1.6 + DOWN * 0.9 * i)
            for i, t in enumerate(txns)
        ])
        lines = VGroup(*[
            DashedLine(origin + LEFT * 1.1 + DOWN * 0.9 * i, origin + RIGHT * (col_w * len(ops)) + DOWN * 0.9 * i,
                       color=GREY_D)
            for i in range(len(txns))
        ])
        cells = VGroup(*[
            op_tex(o, font_size=38, color=TXN_COLORS[rows[txn_of(o)] % 6])
            .move_to(origin + RIGHT * col_w * k + DOWN * 0.9 * rows[txn_of(o)])
            for k, o in enumerate(ops)
        ])
        time = Arrow(origin + LEFT * 1.1 + DOWN * 0.9 * len(txns), origin + RIGHT * col_w * len(ops) + DOWN * 0.9 * len(txns))
        time_label = T("time", font_size=24, color=GREY_B).next_to(time, RIGHT, buff=0.1)
        marks = VGroup(*[SurroundingRectangle(cells[i], color=YELLOW, buff=0.1)
                         for i in v.get("highlight", []) if 0 <= i < len(cells)])
        body = place(fit(VGroup(labels, lines, cells, time, time_label, marks), 12.0, 4.6, grow=True), head)
        n = max(1, len(cells))
        return VGroup(head, body), (
            [([Write(head), FadeIn(labels), ShowCreation(lines), GrowArrow(time), FadeIn(time_label)], 0.12)]
            + [([FadeIn(c, DOWN * 0.3)], 0.45 / n) for c in cells]
            + ([([ShowCreation(m) for m in marks], 0.1)] if len(marks) else [])
        )

    def v_graph(self, v):
        head = heading(v.get("heading", ""))
        names = v.get("nodes", [])
        n = max(1, len(names))
        pos = {name: 2.0 * np.array([np.cos(PI / 2 + TAU * i / n), np.sin(PI / 2 + TAU * i / n), 0]) + DOWN * 0.4
               for i, name in enumerate(names)}
        nodes = VGroup(*[
            VGroup(Circle(radius=0.45).set_stroke(WHITE, 3).move_to(pos[name]),
                   T(name, font_size=32).move_to(pos[name]))
            for name in names
        ])
        edge_list = [tuple(e) for e in v.get("edges", []) if e[0] in pos and e[1] in pos]
        hl = set(v.get("highlight", []))
        arrows = VGroup(*[
            Arrow(pos[a], pos[b], buff=0.5, path_arc=0.5 if (b, a) in edge_list else 0,
                  fill_color=RED if k in hl else GREY_A)
            for k, (a, b) in enumerate(edge_list)
        ])
        body = place(fit(VGroup(nodes, arrows), 11.0, 5.0, grow=True), head)
        return VGroup(head, body), (
            [([Write(head)], 0.08), ([FadeIn(nd, scale=0.6) for nd in nodes], 0.12)]
            + [([GrowArrow(a)], 0.4 / max(1, len(arrows))) for a in arrows]
            + ([([*(Indicate(arrows[k], color=RED) for k in hl if k < len(arrows))], 0.1)] if hl else [])
        )
