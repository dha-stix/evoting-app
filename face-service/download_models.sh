#!/bin/sh
# Downloads the anti-spoofing models (Apache-2.0, github.com/yakhyo/face-anti-spoofing)
# and lets InsightFace fetch buffalo_l so the first request is not slow.
set -e
MODEL_DIR="${MODEL_DIR:-./models}"
mkdir -p "$MODEL_DIR/antispoof"
BASE=https://github.com/yakhyo/face-anti-spoofing/releases/download/weights
for name in MiniFASNetV2.onnx MiniFASNetV1SE.onnx; do
	[ -f "$MODEL_DIR/antispoof/$name" ] || curl -fsSL "$BASE/$name" -o "$MODEL_DIR/antispoof/$name"
done
python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l', root='$MODEL_DIR', allowed_modules=['detection','recognition'], providers=['CPUExecutionProvider']).prepare(ctx_id=-1)"
