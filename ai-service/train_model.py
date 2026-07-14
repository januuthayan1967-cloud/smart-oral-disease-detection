"""Script to create a MobileNetV2-based oral disease classification model."""

import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

CLASSES = [
    "Dental Caries",
    "Dental Calculus",
    "Gingivitis",
    "Mouth Ulcer",
    "Tooth Discoloration",
    "Normal Teeth",
]

NUM_CLASSES = len(CLASSES)
MODEL_DIR = "./models"
MODEL_PATH = os.path.join(MODEL_DIR, "oral_disease_model.keras")


def build_model():
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = layers.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    model = build_model()
    model.save(MODEL_PATH)
    print(f"Base MobileNetV2 model saved to {MODEL_PATH}")
    print("Train this model with your oral disease dataset for production accuracy.")


if __name__ == "__main__":
    main()
