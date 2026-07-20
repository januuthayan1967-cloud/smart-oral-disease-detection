"""Script to create a MobileNetV3-based oral disease classification model."""

import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV3Large

CLASSES = [
    "calculus",
    "caries",
    "gingivitis",
    "healthy_teeth",
    "mouth_ulcer",
    "tooth_discoloration",
]

NUM_CLASSES = len(CLASSES)
MODEL_DIR = "./models"
MODEL_PATH = os.path.join(MODEL_DIR, "mobilenetv3_checkpoint.keras")


def build_model():
    preprocess_input = tf.keras.applications.mobilenet_v3.preprocess_input
    base_model = MobileNetV3Large(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = layers.Input(shape=(224, 224, 3))
    x = preprocess_input(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    model = build_model()
    model.save(MODEL_PATH)
    print(f"Base MobileNetV3 model saved to {MODEL_PATH}")
    print("Train this model with your oral disease dataset for production accuracy.")


if __name__ == "__main__":
    main()
