"""Long-form Moraloop story ad: "Your two best friends are dating... one is cheating."
Setup -> Choice A (tell Riley) -> rewind -> Choice B (keep the secret) -> host asks "What would you do?"
Cast: you = "you" (green), Jordan = "friend" (orange hoodie), Riley = "partner" (purple), the other person = "ex".
"""
import os, sys, math, subprocess
import numpy as np
import ad
import clay
from clay import FPS, W, H

VOICES = {"N": "am_michael", "H": "am_michael", "J": "am_liam", "R": "af_bella", "Y": "am_adam"}
NAMES = {"J": ("Jordan", (255, 170, 80)), "R": ("Riley", (205, 160, 255)), "Y": ("You", (130, 225, 145))}

J, R, Y, X = "friend", "partner", "you", "ex"


def S(voice, text, chars, act, icons=(), react="neutral", cont=False, **kw):
    return dict(kind="scene", voice=voice, text=text, cont=cont,
                sc=dict(chars=list(chars), act=act, icons=list(icons), react=react, **kw))


def CARD(voice, text, title, sub, icon, color=(0.98, 0.70, 0.18)):
    return dict(kind="card", voice=voice, text=text, sc=dict(title=title, sub=sub, icon=icon, color=color))


def M(text, close=False):
    return dict(kind="man", voice="H", text=text, close=close)


BEATS = [
    # ---------------- setup
    S("N", "These are your two best friends. Jordan... and Riley.", [J, R, Y], "react", ["💑"], "happy",
      set="park", exprs={0: "happy", 1: "happy"}),
    S("N", "You've known them forever. Six months ago, they started dating. And honestly? You've never seen them happier.",
      [J, R, Y], "react", ["❤️", "🥰"], "happy", cont=True, set="park", exprs={0: "happy", 1: "happy"}, hold=True),
    S("R", "Same time next week?", [J, R], "say", [], "happy", set="park", speaker=1, you=0, voiced=True, spk_smile=0.8, at=0.3),
    S("J", "Wouldn't miss it.", [J, R], "say", ["😉"], "happy", cont=True, set="park", speaker=0, you=1, voiced=True,
      spk_smile=0.8, hold=True),
    # ---------------- the discovery
    S("N", "Then, one Saturday, you stop by the café for a coffee... and there's Jordan. With someone who is definitely not Riley.",
      [X, J, Y], "witness", ["💋"], "shock", set="cafe", xs=[-262, -100, 210], at=0.72),
    S("Y", "Wait... Jordan?", [X, J, Y], "witness", ["💋"], "shock", cont=True, set="cafe", xs=[-262, -100, 210], hold=True),
    S("J", "Okay. Okay, please. Don't tell Riley. It was a mistake. I'm ending it. I swear.", [J, Y], "tell",
      ["🙏", "🤫"], "worried", set="cafe", voiced=True, spk_expr="worried", at=0.3),
    S("N", "That night, you can't sleep. You know something your best friend doesn't.", [Y], "think",
      ["🤐", "💔", "❓"], set="home_night"),
    S("N", "Then your phone buzzes. It's Riley. Movie night tomorrow? Jordan's bringing snacks!", [Y], "see",
      ["📱", "🍿", "❤️"], "worried", set="home_night"),
    S("N", "So... what do you do?", [Y], "think", ["🗣️", "🤐"], set="home_night"),
    # ---------------- choice A
    CARD("N", "Choice A. You tell Riley.", "CHOICE A", "TELL RILEY", "🗣️"),
    S("Y", "Riley... I need to tell you something. I saw Jordan at the café. With someone else.", [Y, R], "say",
      ["☕", "💋"], "shock", set="home", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
    S("R", "What? How long have you known?", [Y, R], "say", [], "worried", cont=True, set="home", speaker=1, you=0,
      voiced=True, spk_expr="sad", at=0.2),
    S("Y", "Since Saturday. I'm so sorry.", [Y, R], "say", [], "sad", cont=True, set="home", speaker=0, you=1,
      voiced=True, spk_expr="sad", at=0.2),
    S("R", "I know about the café, Jordan. We're done.", [R, J], "say", ["💔"], "sad", set="home_night", speaker=0,
      you=1, voiced=True, spk_expr="angry", at=0.6),
    S("J", "Seriously? You couldn't just stay out of it?", [J, Y], "say", ["😠"], "sad", set="street", voiced=True,
      spk_expr="angry", at=0.5),
    S("N", "Jordan stops answering your texts. Losing that friendship hurts.", [Y], "see", ["📱", "🚫", "💬"], "sad",
      set="home_night"),
    S("R", "Thank you for telling me. I know that wasn't easy.", [R, Y], "say", ["🤝", "❤️"], "happy", set="park",
      speaker=0, voiced=True, spk_smile=0.4, at=0.6),
    S("N", "You lost one friend... but Riley knows the truth. And Riley still trusts you.", [R, Y], "react", ["🤝"],
      "happy", cont=True, set="park", exprs={0: "happy"}, hold=True),
    # ---------------- choice B
    CARD("N", "Now... rewind. Choice B. You keep the secret.", "CHOICE B", "KEEP THE SECRET", "🤐",
         color=(0.36, 0.80, 0.72)),
    S("N", "Movie night. Jordan and Riley are cuddled up, laughing. You smile... and say nothing.", [J, R, Y], "laugh",
      ["🍿", "🎬"], "worried", set="gamenight"),
    S("J", "Hey. Thanks for keeping it between us.", [J, Y], "tell", ["🤫"], "worried", set="gamenight", voiced=True,
      spk_smile=0.5, at=0.5),
    S("N", "Every time Riley laughs at one of Jordan's jokes, the secret gets a little heavier.", [J, R, Y], "laugh",
      ["😂", "🤐", "⏳"], "worried", set="gamenight"),
    S("N", "But weeks later... Jordan never ended it.", [X, J, Y], "witness", ["💋"], "shock", set="street",
      xs=[-262, -100, 210], at=0.6),
    S("N", "And then, Riley finds the messages.", [R], "see", ["📱", "💋", "💬"], "shock", set="home", at=0.5),
    S("R", "Wait. You knew? You knew, and you just let me find out like this?", [R, Y], "say", ["😡", "❓"], "sad",
      cont=True, set="home", speaker=0, you=1, voiced=True, spk_expr="angry", at=0.4),
    S("N", "In the end, Riley stopped trusting both of them. Jordan... and you.", [Y], "think", ["💔", "💔"],
      set="park"),
    # ---------------- the host
    M("Two choices. Two very different endings."),
    M("Tell your friend the truth... or keep the secret?"),
    M("What would you do?", close=True),
]


def default_cam(sc):
    n = len(sc["chars"])
    xs = sc.get("xs") or {1: [0], 2: [-150, 150], 3: [-215, 0, 215]}[n]
    if sc["act"] == "think":
        return (xs[0] * 0.6 + 40, -540, 1080) if n == 1 else (sum(xs) / n * 0.5 + 20, -520, 1240)
    return (0, -520, 1240) if n < 3 else (0, -540, 1360)


def build():
    A = ad.Ad()
    A.spec = {"title": "Two Best Friends", "id": "storyline_two_best_friends"}
    lines, segs, sfx, shrugs, gestures = [], [], [], [], []

    def say(text, voice, t0):
        p = ad.tts(text, VOICES[voice], 0.95 if voice in "NH" else 1.0)
        d = len(ad.wav(p)) / ad.SR
        ln = dict(t=t0, text=text, dur=d, path=p)
        if voice in NAMES:
            ln["name"], ln["color"] = NAMES[voice]
        lines.append(ln)
        return d

    t = 1.4
    for i, b in enumerate(BEATS):
        new = not (b.get("cont") and segs and segs[-1]["kind"] == "scene")
        if b["kind"] == "man" and segs and segs[-1]["kind"] == "man":
            new = False
        if new:
            t0 = t if segs else 0.0
            if segs:
                segs[-1]["t1"] = t0
                if b["kind"] != "man":
                    sfx.append(("whoosh", t0 - 0.3))
            seg = dict(kind=b["kind"], t0=t0, data=dict(b.get("sc", {})))
            if b["kind"] == "scene" and "cam" not in seg["data"]:
                seg["data"]["cam"] = default_cam(seg["data"])
                seg["data"]["push"] = 35
            if b["kind"] == "man":
                seg["shift"] = t0 - 1.0
                sfx += [("clunk", t0), ("clunk2", t0 + 0.18)]
            if b["kind"] == "card":
                sfx += [("pop", t0 + 0.2), ("pop", t0 + 0.55), ("pop", t0 + 0.85)]
            segs.append(seg)
            vs = max(t, t0 + {"scene": 0.35, "card": 0.7, "man": 1.3}[b["kind"]])
        elif b["kind"] == "man":
            vs = t
        else:
            vs = t + 0.1
            # continuing shot: keep the same camera
            segs[-1]["t1"] = vs
            seg = dict(kind="scene", t0=vs, data=dict(b["sc"]), cont=True)
            seg["data"]["cam"] = segs[-1]["data"]["cam"]
            seg["data"]["push"] = 35
            segs.append(seg)
        d = say(b["text"], b["voice"], vs)
        if b["kind"] == "man":
            if b.get("close"):
                shrugs.append((vs - 0.15, vs + d + 0.9))
            else:
                gestures.append((vs, vs + d))
        t = vs + d + ({"scene": 0.7, "card": 0.6, "man": 0.45}[b["kind"]])
        if b["kind"] == "card":
            t = max(t, segs[-1]["t0"] + 2.6)
        if b.get("close"):
            t += 0.9
    d = say("More questions like this on Moraloop.", "H", t)
    A.smile_t = t
    A.CARD = t + d * 0.55
    t2 = max(t + d + 0.3, A.CARD + 1.5)
    d2 = say("Coming soon.", "H", t2)
    A.DUR = t2 + d2 + 1.8
    segs[-1]["t1"] = A.DUR + 1
    sfx += [("chime", A.CARD), ("pop", A.CARD + 1.1)]
    # man camera: pops up wide, then pushes in to a good head-and-shoulders distance
    for s in segs:
        if s["kind"] == "man":
            s["cam"] = (1050, 470, -530, -625)
    for s in segs:
        if s["kind"] != "scene" or s.get("cont"):
            continue
        sc = s["data"]
        u2t = lambda u: s["t0"] + (s["t1"] - s["t0"]) * u
        if sc.get("icons") and not sc.get("hold"):
            sfx.append(("pop", u2t(0.12 if sc["act"] != "think" else 0.3)))
        if sc.get("react") == "shock" and not sc.get("hold"):
            sfx.append(("sting", u2t(sc.get("at", 0.55))))
        if sc["act"] == "think":
            for k in np.arange(u2t(0.2), s["t1"] - 0.1, 0.5):
                sfx.append(("tick", k))
    A.lines, A.segs, A.sfx, A.cards, A.shrugs, A.gestures = lines, segs, sfx, [], shrugs, gestures
    for s in segs:
        s["idx"] = 7
    N = int(ad.SR * (A.DUR + 1))
    v = np.zeros(N, np.float32)
    for ln in lines:
        a = ad.wav(ln["path"])
        s0 = int(ln["t"] * ad.SR)
        v[s0:s0 + len(a)] += a[:N - s0]
    A.voice = v
    nf = int(A.DUR * FPS) + 2
    env = np.zeros(nf)
    w = int(0.035 * ad.SR)
    for f in range(nf):
        c = int(f / FPS * ad.SR)
        seg = v[max(0, c - w):c + w]
        env[f] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    env /= np.quantile(env[env > 0.003], 0.9) + 1e-6
    A.env = np.clip(np.convolve(env, [0.25, 0.5, 0.25], mode="same"), 0, 1.3)
    return A


_orig_scene_man = ad.scene_man


def scene_man_story(t, seg):
    """Host pops up: the spotlight clunks on at the start of his segment."""
    orig = clay.lighting_man
    clay.lighting_man = lambda F, tt: orig(F, tt - seg.get("shift", 0.0))
    try:
        return _orig_scene_man(t, seg)
    finally:
        clay.lighting_man = orig


def load():
    ad.scene_man = scene_man_story
    ad.AD = build()
    clay.CARD, clay.DUR = ad.AD.CARD, ad.AD.DUR
    return ad.AD


def _init():
    load()


def _job(i):
    return np.asarray(ad.render(i / FPS)).tobytes()


def render(out):
    from multiprocessing import Pool
    A = load()
    wavp = f"{ad.S_DIR}/out/storyline.wav"
    os.makedirs(f"{ad.S_DIR}/out", exist_ok=True)
    ad.mix_audio(wavp)
    n = int(A.DUR * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", wavp, "-c:v", "libx264", "-preset", "medium", "-crf", "26",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out],
                          stdin=subprocess.PIPE)
    with Pool(4, initializer=_init) as p:
        for k, b in enumerate(p.imap(_job, range(n), chunksize=2)):
            ff.stdin.write(b)
            if k % 240 == 0:
                print(f"{k}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()


if __name__ == "__main__":
    if sys.argv[1] == "plan":
        A = load()
        for s in A.segs:
            print(s["kind"], round(s["t0"], 1), round(s["t1"], 1), s.get("data", {}).get("act", s.get("data", {}).get("title", "")))
        print("DUR", round(A.DUR, 1))
    elif sys.argv[1] == "still":
        load()
        for ts in sys.argv[2:]:
            ad.render(float(ts)).save(f"{ad.S_DIR}/story_{ts}.png")
    elif sys.argv[1] == "render":
        render(sys.argv[2])
