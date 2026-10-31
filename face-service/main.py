"""AuthVote face service.

Detects faces, extracts ArcFace embeddings (InsightFace buffalo_l), measures
head turn, image quality and anti-spoofing (MiniFASNet V2 + V1SE). It makes no
pass/fail decisions: the Next.js server applies the thresholds.
"""

import base64
import hmac
import os
from functools import lru_cache

import cv2
import numpy as np
import onnxruntime as ort
from fastapi import Depends, FastAPI, Header, HTTPException
from insightface.app import FaceAnalysis
from pydantic import BaseModel, Field

API_KEY = os.environ.get("FACE_SERVICE_KEY", "")
MODEL_DIR = os.environ.get("MODEL_DIR", "/models")
MAX_IMAGE_BYTES = 2 * 1024 * 1024
MAX_SIDE = 1280
MIN_DET_SCORE = 0.5

# (file, crop scale) as published with the weights.
ANTISPOOF_MODELS = [("MiniFASNetV2.onnx", 2.7), ("MiniFASNetV1SE.onnx", 4.0)]

app = FastAPI(title="AuthVote face service", docs_url=None, redoc_url=None)


class ImageIn(BaseModel):
    id: str = Field(max_length=16)
    data: str  # base64 JPEG, no data: prefix


class AnalyzeIn(BaseModel):
    images: list[ImageIn] = Field(min_length=1, max_length=4)


def require_key(x_api_key: str = Header(default="")) -> None:
    if not API_KEY or not hmac.compare_digest(x_api_key, API_KEY):
        raise HTTPException(status_code=401, detail="unauthorised")


@lru_cache(maxsize=1)
def face_app() -> FaceAnalysis:
    fa = FaceAnalysis(
        name="buffalo_l",
        root=MODEL_DIR,
        allowed_modules=["detection", "recognition"],
        providers=["CPUExecutionProvider"],
    )
    fa.prepare(ctx_id=-1, det_size=(640, 640))
    return fa


@lru_cache(maxsize=1)
def antispoof_sessions() -> list[tuple[ort.InferenceSession, float, tuple[int, int]]]:
    sessions = []
    for name, scale in ANTISPOOF_MODELS:
        path = os.path.join(MODEL_DIR, "antispoof", name)
        if not os.path.exists(path):
            continue
        sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
        shape = sess.get_inputs()[0].shape[2:]
        size = tuple(int(s) if isinstance(s, int) else 80 for s in shape)
        sessions.append((sess, scale, size))
    return sessions


def decode(data: str) -> np.ndarray:
    try:
        raw = base64.b64decode(data, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid image encoding") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image too large")
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="unreadable image")
    h, w = img.shape[:2]
    if max(h, w) > MAX_SIDE:
        f = MAX_SIDE / max(h, w)
        img = cv2.resize(img, (int(w * f), int(h * f)), interpolation=cv2.INTER_AREA)
    return img


def crop(img: np.ndarray, bbox: np.ndarray, scale: float, size: tuple[int, int]) -> np.ndarray:
    """Square-ish crop around the face, matching the MiniFASNet reference code."""
    src_h, src_w = img.shape[:2]
    x1, y1, x2, y2 = bbox
    box_w, box_h = max(x2 - x1, 1), max(y2 - y1, 1)
    scale = min((src_h - 1) / box_h, (src_w - 1) / box_w, scale)
    new_w, new_h = box_w * scale, box_h * scale
    cx, cy = x1 + box_w / 2, y1 + box_h / 2
    left, top = max(0, int(cx - new_w / 2)), max(0, int(cy - new_h / 2))
    right, bottom = min(src_w - 1, int(cx + new_w / 2)), min(src_h - 1, int(cy + new_h / 2))
    return cv2.resize(img[top : bottom + 1, left : right + 1], (size[1], size[0]))


def live_score(img: np.ndarray, bbox: np.ndarray) -> float | None:
    sessions = antispoof_sessions()
    if not sessions:
        return None
    scores = []
    for sess, scale, size in sessions:
        face = crop(img, bbox, scale, size).astype(np.float32)  # BGR, 0-255
        tensor = np.expand_dims(np.transpose(face, (2, 0, 1)), 0)
        logits = sess.run(None, {sess.get_inputs()[0].name: tensor})[0]
        e = np.exp(logits - logits.max(axis=1, keepdims=True))
        probs = e / e.sum(axis=1, keepdims=True)
        scores.append(float(probs[0, 1]))  # index 1 = real
    return float(np.mean(scores))


def quality(img: np.ndarray, bbox: np.ndarray) -> tuple[float, float]:
    x1, y1, x2, y2 = [int(v) for v in bbox]
    h, w = img.shape[:2]
    face = img[max(0, y1) : min(h, y2), max(0, x1) : min(w, x2)]
    if face.size == 0:
        return 0.0, 0.0
    gray = cv2.cvtColor(cv2.resize(face, (112, 112)), cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var()), float(gray.mean())


def yaw_ratio(kps: np.ndarray) -> float:
    """Nose offset from the eye midpoint in eye-widths.

    Frames arrive un-mirrored, so a person turning to their own left moves the
    nose towards the right of the image: positive values mean "turned left".
    """
    eye_a, eye_b, nose = kps[0], kps[1], kps[2]
    eye_dist = max(abs(eye_b[0] - eye_a[0]), 1.0)
    return float((nose[0] - (eye_a[0] + eye_b[0]) / 2) / eye_dist)


def analyse_one(image: ImageIn) -> dict:
    img = decode(image.data)
    faces = [f for f in face_app().get(img) if f.det_score >= MIN_DET_SCORE]
    base = {"id": image.id, "face_count": len(faces)}
    if not faces:
        return {**base, "det_score": 0, "embedding": None, "yaw": 0, "spoof_score": None, "sharpness": 0, "brightness": 0, "face_ratio": 0}
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    sharpness, brightness = quality(img, face.bbox)
    return {
        **base,
        "det_score": float(face.det_score),
        "embedding": face.normed_embedding.astype(float).round(6).tolist(),
        "yaw": yaw_ratio(face.kps),
        "spoof_score": live_score(img, face.bbox),
        "sharpness": sharpness,
        "brightness": brightness,
        "face_ratio": float((face.bbox[2] - face.bbox[0]) / img.shape[1]),
    }


@app.get("/health")
def health() -> dict:
    return {"ok": True, "antispoof": len(antispoof_sessions()) > 0}


@app.post("/analyze", dependencies=[Depends(require_key)])
def analyze(body: AnalyzeIn) -> dict:
    return {
        "model": "insightface-buffalo_l",
        "antispoof": len(antispoof_sessions()) > 0,
        "results": [analyse_one(i) for i in body.images],
    }


@app.on_event("startup")
def warm_up() -> None:
    face_app()
    antispoof_sessions()
