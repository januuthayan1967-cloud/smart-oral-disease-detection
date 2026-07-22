"""Oral Disease Detection AI Microservice using MobileNetV3."""

import os
import io
import traceback
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image

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
MODEL_ERROR = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models", "mobilenetv3_checkpoint.keras"))


def load_model():
    """Load MobileNetV3 model using standalone keras or tensorflow.keras."""
    global MODEL, MODEL_ERROR

    resolved_path = MODEL_PATH
    if not os.path.isabs(resolved_path):
        resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))

    if not os.path.exists(resolved_path):
        MODEL_ERROR = f"Model file not found at path: {resolved_path}"
        print(f"CRITICAL ERROR: {MODEL_ERROR}")
        return False

    try:
        print(f"Attempting to load MobileNetV3 model from {resolved_path}...")
        # 1. Try standalone Keras 3 (recommended for .keras format)
        try:
            import keras
            MODEL = keras.models.load_model(resolved_path)
            print(f"MobileNetV3 model successfully loaded using Keras {keras.__version__} from {resolved_path}")
        except Exception as k_err:
            print(f"Standalone Keras load attempt failed ({k_err}), trying tf.keras compile=False...")
            import tensorflow as tf
            try:
                MODEL = tf.keras.models.load_model(resolved_path, compile=False)
                print(f"MobileNetV3 model successfully loaded using tf.keras (compile=False) from {resolved_path}")
            except Exception as tf_err:
                print(f"tf.keras compile=False failed ({tf_err}), trying tf.keras standard load...")
                MODEL = tf.keras.models.load_model(resolved_path)
                print(f"MobileNetV3 model successfully loaded using tf.keras from {resolved_path}")

        MODEL_ERROR = None
        return True
    except Exception as exc:
        err_msg = f"Failed to load MobileNetV3 model: {str(exc)}"
        MODEL_ERROR = err_msg
        print(f"CRITICAL ERROR: {err_msg}")
        traceback.print_exc()
        return False


def preprocess_image(image_bytes):
    """
    Preprocess image for MobileNetV3 inference.
    Resizes image to 224x224 and returns float32 array in [0, 255] range.
    """
    img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_dims = img_pil.size
    orig_mode = img_pil.mode

    # Resize to 224x224 to match model input shape (224, 224, 3)
    img_resized = img_pil.resize((224, 224), resample=Image.NEAREST)

    img_array = np.array(img_resized, dtype=np.float32)
    img_array_expanded = np.expand_dims(img_array, axis=0)

    return img_array_expanded, {
        "orig_dims": orig_dims,
        "orig_mode": orig_mode,
        "resized_dims": (224, 224),
    }


def predict(image_bytes, debug_mode=False):
    """Run MobileNetV3 inference and return predictions & probabilities."""
    if MODEL is None:
        raise RuntimeError(MODEL_ERROR or "MobileNetV3 model is not loaded.")

    img_array, meta = preprocess_image(image_bytes)

    # Run inference (supports both keras and tf.keras models)
    raw_preds = MODEL(img_array, training=False)
    if hasattr(raw_preds, "numpy"):
        raw_preds = raw_preds.numpy()[0]
    else:
        raw_preds = np.array(raw_preds)[0]

    class_idx = int(np.argmax(raw_preds))
    top_disease = CLASSES[class_idx]
    confidence = float(raw_preds[class_idx] * 100)

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
            "modelInputShape": list(MODEL.input_shape) if hasattr(MODEL, "input_shape") else None,
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


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Smart Oral Disease Detection AI Microservice",
        "model": "MobileNetV3",
        "status": "healthy" if MODEL is not None else "unhealthy",
        "model_loaded": MODEL is not None,
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)",
            "classes": "/classes"
        }
    }), (200 if MODEL is not None else 500)


@app.route("/health", methods=["GET"])
def health():
    if MODEL is None:
        return jsonify({
            "status": "unhealthy",
            "model_loaded": False,
            "error": MODEL_ERROR or "MobileNetV3 model not loaded",
            "classes": CLASSES,
        }), 500

    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "model_name": "MobileNetV3",
        "classes": CLASSES,
    }), 200


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    if MODEL is None:
        return jsonify({
            "success": False,
            "error": f"MobileNetV3 AI model is unavailable: {MODEL_ERROR or 'Model not loaded'}"
        }), 500

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
            "modelUsed": "mobilenetv3",
        }
        if debug_mode:
            response["debug"] = debug_info

        return jsonify(response)
    except Exception as exc:
        return jsonify({"success": False, "error": f"Prediction failed: {str(exc)}"}), 400


@app.route("/classes", methods=["GET"])
def get_classes():
    return jsonify({"classes": CLASSES, "raw_keys": RAW_CLASS_KEYS})


# Load MobileNetV3 model on startup
load_model()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
