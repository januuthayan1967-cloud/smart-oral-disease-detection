import os
import sys
import numpy as np

def test_mobilenetv3_checkpoint():
    model_path = os.path.join(os.path.dirname(__file__), "models", "mobilenetv3_checkpoint.keras")
    print(f"Checking model file existence at: {model_path}")
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        sys.exit(1)

    print(f"Model file size: {os.path.getsize(model_path)} bytes")

    try:
        import tensorflow as tf
        print(f"TensorFlow Version: {tf.__version__}")

        print("Loading MobileNetV3 model...")
        model = tf.keras.models.load_model(model_path)
        print("Model loaded successfully!")

        print("\n--- Model Summary / Input & Output Shapes ---")
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")

        print("\n--- Layer Architecture Inspection ---")
        for i, layer in enumerate(model.layers[:10]):
            print(f"Layer {i}: {layer.name} ({layer.__class__.__name__})")

        # Test dummy prediction tensor
        dummy_input = np.ones((1, 224, 224, 3), dtype=np.float32) * 128.0
        predictions = model.predict(dummy_input, verbose=0)[0]

        print("\n--- Prediction Output Test ---")
        print(f"Predictions shape: {predictions.shape}")
        print(f"Raw probabilities: {predictions}")
        print(f"Probabilities sum: {np.sum(predictions):.6f}")

        class_names = ['calculus', 'caries', 'gingivitis', 'healthy_teeth', 'mouth_ulcer', 'tooth_discoloration']
        print("\n--- Class Mapping ---")
        for idx, (cname, prob) in enumerate(zip(class_names, predictions)):
            print(f"Index {idx}: {cname} -> {prob * 100:.2f}%")

        print("\nVerification successful!")
    except Exception as e:
        print(f"\nERROR testing model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_mobilenetv3_checkpoint()
