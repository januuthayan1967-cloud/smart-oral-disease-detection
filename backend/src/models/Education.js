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
    source: {
      type: String,
      default: 'World Health Organization (WHO)',
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    videoUrl: String,
    readTime: {
      type: String,
      default: '3 min read',
    },
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
