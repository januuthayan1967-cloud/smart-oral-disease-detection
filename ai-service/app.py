"""Oral Disease Detection AI Microservice using MobileNetV3."""

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

# Exact class order confirmed from training notebook mobilenetv3.ipynb
CLASSES = [
    "Dental Calculus",
    "Dental Caries",
    "Gingivitis",
    "Normal Teeth",
    "Mouth Ulcer",
    "Tooth Discoloration",
]

RAW_CLASS_KEYS = [
    "calculus",
    "caries",
    "gingivitis",
    "healthy_teeth",
    "mouth_ulcer",
    "tooth_discoloration",
]

MODEL = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models", "mobilenetv3_checkpoint.keras"))


def load_model():
    """Load TensorFlow/Keras MobileNetV3 model if available."""
    global MODEL

    resolved_path = MODEL_PATH
    if not os.path.isabs(resolved_path):
        resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))

    if os.path.exists(resolved_path):
        try:
            import tensorflow as tf

            MODEL = tf.keras.models.load_model(resolved_path)
            print(f"MobileNetV3 model successfully loaded from {resolved_path}")
            return True
        except Exception as exc:
            print(f"Failed to load MobileNetV3 model: {exc}")

    print("No trained MobileNetV3 model found. Using heuristic fallback prediction.")
    return False


def preprocess_image(image_bytes):
    """
    Preprocess image for MobileNetV3 inference.
    Resizes image to 224x224 and returns float32 array in [0, 255] range
    matching the input tensor expectations of the Keras graph.
    """
    img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_dims = img_pil.size
    orig_mode = img_pil.mode

    # Resize to 224x224 to match model input shape (224, 224, 3)
    img_resized = img_pil.resize((224, 224), resample=Image.NEAREST)

    # Convert to float32 array in range [0, 255] (preprocess_input layer inside model handles scaling)
    img_array = np.array(img_resized, dtype=np.float32)
    img_array_expanded = np.expand_dims(img_array, axis=0)

    # Keep a uint8 version for heuristic predict compatibility if model is unavailable
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

    total_score = sum(scores.values()) or 1.0
    probabilities = {cls: round((score / total_score) * 100, 2) for cls, score in scores.items()}

    return best_class, round(confidence, 2), probabilities


def predict(image_bytes, debug_mode=False):
    """Run MobileNetV3 or heuristic prediction and return predictions & probabilities."""
    img_array, processed_img, meta = preprocess_image(image_bytes)

    if MODEL is not None:
        raw_preds = MODEL.predict(img_array, verbose=0)[0]
        class_idx = int(np.argmax(raw_preds))
        top_disease = CLASSES[class_idx]
        confidence = float(raw_preds[class_idx] * 100)

        # Probabilities dictionary with both display name and raw class keys
        probabilities = {
            CLASSES[i]: round(float(raw_preds[i] * 100), 2) for i in range(len(raw_preds))
        }
        probabilities_raw = {
            RAW_CLASS_KEYS[i]: round(float(raw_preds[i] * 100), 2) for i in range(len(raw_preds))
        }

        debug_info = {}
        if debug_mode:
            resolved_path = MODEL_PATH
            if not os.path.isabs(resolved_path):
                resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))
            model_size = os.path.getsize(resolved_path) if os.path.exists(resolved_path) else None

            debug_info = {
                "modelFilePath": MODEL_PATH,
                "modelFileSize": model_size,
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
                "rawClassProbabilities": probabilities_raw,
                "finalPredictedClass": top_disease,
            }

        return top_disease, round(confidence, 2), probabilities, debug_info

    # Fallback to heuristic
    best_class, confidence, probabilities = heuristic_predict(processed_img)
    return best_class, confidence, probabilities, {}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "model_name": "MobileNetV3" if MODEL is not None else "Heuristic Fallback",
        "classes": CLASSES,
    })


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400

    file = request.files["image"]
    debug_mode = request.args.get("debug", "false").lower() == "true"

    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        image_bytes = file.read()
        if len(image_bytes) == 0:
            return jsonify({"success": False, "error": "Uploaded image file is empty"}), 400

        # Verify PIL can open image
        Image.open(io.BytesIO(image_bytes)).verify()

        disease_name, confidence, probabilities, debug_info = predict(image_bytes, debug_mode=debug_mode)

        response = {
            "success": True,
            "diseaseName": disease_name,
            "confidence": confidence,
            "prediction": {
                "class": disease_name,
                "confidence": round(confidence / 100.0, 4),
            },
            "probabilities": probabilities,
            "modelUsed": "mobilenetv3" if MODEL is not None else "heuristic",
        }
        if debug_mode:
            response["debug"] = debug_info

        return jsonify(response)
    except Exception as exc:
        return jsonify({"success": False, "error": f"Invalid or unreadable image file: {str(exc)}"}), 400


@app.route("/classes", methods=["GET"])
def get_classes():
    return jsonify({"classes": CLASSES, "raw_keys": RAW_CLASS_KEYS})


load_model()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
