import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
import json
import os

# Directory paths
train_dir = r'C:\Users\ABHISHEK\Downloads\projects\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)\train'
validation_dir = r'C:\Users\ABHISHEK\Downloads\projects\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)\valid'
model_path = 'crop_disease_model.keras'
class_indices_path = 'class_indices.json'

# Check if the model and class indices file already exist
if os.path.exists(model_path) and os.path.exists(class_indices_path):
    print("Loading existing model and class indices...")
    model = tf.keras.models.load_model(model_path)
    with open(class_indices_path, 'r') as f:
        class_indices = json.load(f)
else:
    # Image Data Generator for data augmentation and normalization
    train_datagen = ImageDataGenerator(
        rescale=1.0/255,
        rotation_range=40,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )

    validation_datagen = ImageDataGenerator(rescale=1.0/255)

    # Loading data
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(128, 128),
        batch_size=32,
        class_mode='categorical',
        shuffle=True
    )

    validation_generator = validation_datagen.flow_from_directory(
        validation_dir,
        target_size=(128, 128),
        batch_size=32,
        class_mode='categorical',
        shuffle=False  # No shuffle for validation/testing
    )

    # Ensure steps per epoch and validation steps are calculated properly
    steps_per_epoch = train_generator.samples // train_generator.batch_size
    validation_steps = validation_generator.samples // validation_generator.batch_size

    # Building the CNN Model
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 3)),
        MaxPooling2D(pool_size=(2, 2)),
        
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(train_generator.num_classes, activation='softmax')
    ])

    # Compiling the Model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Callbacks for Early Stopping and Model Checkpointing
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=5, verbose=1, restore_best_weights=True),
        ModelCheckpoint(model_path, monitor='val_loss', save_best_only=True, verbose=1)
    ]

    # Training the Model
    history = model.fit(
        train_generator,
        steps_per_epoch=train_generator.samples // train_generator.batch_size,
        validation_data=validation_generator,
        validation_steps=validation_generator.samples // validation_generator.batch_size,
        epochs=20,
        callbacks=callbacks
    )

    # Save class indices to JSON file after training
    class_indices = validation_generator.class_indices
    with open(class_indices_path, 'w') as json_file:
        json.dump(class_indices, json_file)

# Evaluating the Model
loss, accuracy = model.evaluate(validation_generator)
print(f'Validation Loss: {loss:.4f}')
print(f'Validation Accuracy: {accuracy:.4f}')

# Predicting on the validation set
Y_pred = model.predict(validation_generator, validation_steps + 1)
y_pred = np.argmax(Y_pred, axis=1)

# Generate confusion matrix and classification report
print('Confusion Matrix')
print(confusion_matrix(validation_generator.classes, y_pred))

print('Classification Report')
target_names = list(validation_generator.class_indices.keys())
print(classification_report(validation_generator.classes, y_pred, target_names=target_names))

# Save the Model
model.save(model_path)

# Plotting training & validation accuracy/loss values
import matplotlib.pyplot as plt

# Plot accuracy
plt.plot(history.history['accuracy'])
plt.plot(history.history['val_accuracy'])
plt.title('Model Accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.legend(['Train', 'Validation'], loc='upper left')
plt.show()

# Plot loss
plt.plot(history.history['loss'])
plt.plot(history.history['val_loss'])
plt.title('Model Loss')
plt.ylabel('Loss')
plt.xlabel('Epoch')
plt.legend(['Train', 'Validation'], loc='upper left')
plt.show()
