import tensorflow as tf
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout # type: ignore
from tensorflow.keras.preprocessing.image import ImageDataGenerator # type: ignore
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint # type: ignore

# Directory paths
train_dir = r'C:\Users\Lenovo\Downloads\projects\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)\train'
validation_dir = r'C:\Users\Lenovo\Downloads\projects\New Plant Diseases Dataset(Augmented)\New Plant Diseases Dataset(Augmented)\valid'

# Image Data Generator for data augmentation and normalization
train_datagen = ImageDataGenerator(
    rescale=1.0/255,        # Normalize pixel values
    rotation_range=40,      # Random rotation between 0 and 40 degrees
    width_shift_range=0.2,  # Randomly shift images horizontally
    height_shift_range=0.2, # Randomly shift images vertically
    shear_range=0.2,        # Shear images
    zoom_range=0.2,         # Zoom images
    horizontal_flip=True,   # Randomly flip images horizontally
    fill_mode='nearest'     # Strategy for filling in new pixels
)

validation_datagen = ImageDataGenerator(rescale=1.0/255)

# Loading data
train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical',
    shuffle=True  # Shuffle data for better training
)

validation_generator = validation_datagen.flow_from_directory(
    validation_dir,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical'
)

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
    ModelCheckpoint('crop_disease_model.keras', monitor='val_loss', save_best_only=True, verbose=1)
]

# Training the Model
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples, # batch_size,
    validation_steps=validation_generator.samples, # batch_size,
    # steps_per_epoch=train_generator.samples // train_generator.batch_size,
    validation_data=validation_generator,
    # validation_steps=validation_generator.samples // validation_generator.batch_size,
    epochs=20,
    callbacks=callbacks
)

# Evaluating the Model
loss, accuracy = model.evaluate(validation_generator)
print(f'Validation Loss: {loss:.4f}')
print(f'Validation Accuracy: {accuracy:.4f}')

# Save the Model
model.save('crop_disease_final_model.keras')
