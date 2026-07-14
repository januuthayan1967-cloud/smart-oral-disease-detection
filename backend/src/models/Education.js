import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'articles',
        'tips',
        'brushing',
        'flossing',
        'mouthwash',
        'prevention',
        'video',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    videoUrl: String,
    imageUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Education = mongoose.model('Education', educationSchema);

export default Education;
