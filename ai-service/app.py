"""Oral Disease Detection AI Microservice using MobileNetV2."""

import os
import io
import hashlib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import cv2

load_dotenv()

app = Flask(__name__)
CORS(app)

CLASSES = [
    "Dental Calculus",
    "Dental Caries",
    "Gingivitis",
    "Normal Teeth",
    "Mouth Ulcer",
    "Tooth Discoloration",
]

MODEL = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models", "mymodel_checkpoint.keras"))


def load_model():
    """Load TensorFlow/Keras MobileNetV2 model if available."""
    global MODEL

    resolved_path = MODEL_PATH
    if not os.path.isabs(resolved_path):
        resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))

    if os.path.exists(resolved_path):
        try:
            import tensorflow as tf

            MODEL = tf.keras.models.load_model(resolved_path)
            print(f"Model loaded from {resolved_path}")
            return True
        except Exception as exc:
            print(f"Failed to load model: {exc}")

    print("No trained model found. Using heuristic fallback prediction.")
    return False


def preprocess_image(image_bytes):
    """Preprocess image using PIL to match Google Colab pipeline exactly (NEAREST resizing)."""
    img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_dims = img_pil.size
    orig_mode = img_pil.mode

    # Resize to 224x224 using Nearest-Neighbor to match Keras's image.load_img
    img_resized = img_pil.resize((224, 224), resample=Image.NEAREST)

    # Convert to float32 array
    img_array = np.array(img_resized, dtype=np.float32)
    img_array_expanded = np.expand_dims(img_array, axis=0)

    # Keep a uint8 version for fallback heuristic predict compatibilities
    img_uint8 = np.array(img_resized, dtype=np.uint8)

    return img_array_expanded, img_uint8, {
        "orig_dims": orig_dims,
        "orig_mode": orig_mode,
        "resized_dims": (224, 224),
    }



def heuristic_predict(img):
    """Fallback prediction using image color/texture heuristics when model is unavailable."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    mean_brightness = np.mean(gray)
    red_channel = np.mean(img[:, :, 0])
    yellow_score = np.mean((hsv[:, :, 0] > 15) & (hsv[:, :, 0] < 35))
    dark_spots = np.mean(gray < 80)
    edge_density = np.mean(cv2.Canny(gray, 50, 150) > 0)

    scores = {
        "Dental Caries": dark_spots * 100 + (100 - mean_brightness) * 0.2,
        "Dental Calculus": edge_density * 80 + yellow_score * 40,
        "Gingivitis": red_channel * 0.3 + (100 - mean_brightness) * 0.1,
        "Mouth Ulcer": dark_spots * 60 + edge_density * 30,
        "Tooth Discoloration": yellow_score * 100 + (100 - mean_brightness) * 0.15,
        "Normal Teeth": mean_brightness * 0.5 + (1 - dark_spots) * 30,
    }

    image_hash = int(hashlib.md5(gray.tobytes()).hexdigest(), 16)
    for i, disease in enumerate(CLASSES):
        scores[disease] += (image_hash % (i + 3)) * 0.01

    best_class = max(scores, key=scores.get)
    raw_confidence = scores[best_class]
    confidence = min(95.0, max(55.0, raw_confidence))

    return best_class, round(confidence, 2)


def predict(image_bytes, debug_mode=False):
    """Run model or heuristic prediction and support returning debug metadata."""
    img_array, processed_img, meta = preprocess_image(image_bytes)

    # Get model details if loaded
    model_hash = None
    model_size = None
    if MODEL is not None:
        resolved_path = MODEL_PATH
        if not os.path.isabs(resolved_path):
            resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))
        if os.path.exists(resolved_path):
            model_size = os.path.getsize(resolved_path)
            sha256 = hashlib.sha256()
            with open(resolved_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256.update(chunk)
            model_hash = sha256.hexdigest()

    if MODEL is not None:
        predictions = MODEL.predict(img_array, verbose=0)[0]
        class_idx = int(np.argmax(predictions))
        confidence = float(predictions[class_idx] * 100)

        # Build class names order to match training keys
        colab_classes_keys = [
            'calculus', 'caries', 'gingivitis', 'healthy_teeth', 'mouth_ulcer', 'tooth_discoloration'
        ]
        probabilities = {
            colab_classes_keys[i]: float(predictions[i] * 100) for i in range(len(predictions))
        }

        debug_info = {}
        if debug_mode:
            debug_info = {
                "modelFilePath": MODEL_PATH,
                "modelFileSize": model_size,
                "modelHash": model_hash,
                "modelInputShape": list(MODEL.input_shape),
                "imageOriginalDimensions": f"{meta['orig_dims'][0]}x{meta['orig_dims'][1]}",
                "imageResizedDimensions": f"{meta['resized_dims'][0]}x{meta['resized_dims'][1]}",
                "imageColorMode": meta["orig_mode"],
                "tensorShape": list(img_array.shape),
                "tensorDtype": str(img_array.dtype),
                "minPixelValue": float(np.min(img_array)),
                "maxPixelValue": float(np.max(img_array)),
                "meanPixelValue": float(np.mean(img_array)),
                "classProbabilities": probabilities,
                "finalPredictedClass": CLASSES[class_idx],
            }
        return CLASSES[class_idx], round(confidence, 2), debug_info

    # Fallback to heuristic
    best_class, confidence = heuristic_predict(processed_img)
    return best_class, confidence, {}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "classes": CLASSES,
    })


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    debug_mode = request.args.get("debug", "false").lower() == "true"

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        image_bytes = file.read()
        Image.open(io.BytesIO(image_bytes)).verify()

        disease_name, confidence, debug_info = predict(image_bytes, debug_mode=debug_mode)

        response = {
            "success": True,
            "diseaseName": disease_name,
            "confidence": confidence,
            "modelUsed": "mobilenetv2" if MODEL is not None else "heuristic",
        }
        if debug_mode:
            response["debug"] = debug_info

        return jsonify(response)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/classes", methods=["GET"])
def get_classes():
    return jsonify({"classes": CLASSES})


load_model()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
