# Smart Oral Disease Detection and Dental Care Assistance System

A production-ready full-stack web application for detecting oral diseases using Deep Learning and providing dental healthcare assistance.

## Architecture

```
React Frontend (Vite) → Express Backend → Flask AI Service → MobileNetV3 Model
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Chart.js, React Hook Form, Axios, Socket.io, React Image Crop |
| Backend | Node.js, Express, JWT, bcrypt, Multer, PDFKit, Socket.io |
| AI Service | Python Flask, TensorFlow/Keras MobileNetV3, OpenCV |
| Database | MongoDB Atlas, Mongoose |

## Project Structure

```
smart-oral-disease-detection/
├── backend/          # Express REST API
├── frontend/         # React Vite SPA
├── ai-service/       # Flask AI microservice (MobileNetV3)
├── docs/             # API documentation
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)

## Setup Instructions

### 1. MongoDB Atlas

Create a cluster and get your connection string. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/oral_disease_db?retryWrites=true&w=majority
```

Also add your current IP address to the Atlas Network Access / IP Access List. During development, you can temporarily allow `0.0.0.0/0`, but do not use that setting in production.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm install
npm run seed    # Creates admin user and sample data
npm run dev     # Starts on http://localhost:5000
```

**Default Admin:** `admin@oralhealth.ai` / `Admin@123`

### 3. AI Service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
python app.py                 # Starts on http://localhost:5001
```

Optional: Create base MobileNetV3 model:
```bash
python train_model.py
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                   # Starts on http://localhost:5173
```

## Features

- **User Authentication** — Register, login, JWT + refresh tokens, forgot/reset password, email verification
- **AI Disease Detection & Manual Teeth Crop** — Interactive teeth crop workflow, MobileNetV3 disease predictions with confidence scores and class probabilities
- **PDF Reports** — Auto-generated downloadable reports after each prediction
- **Chat Assistant** — FAQ-based dental care chatbot with history
- **Education Module** — Articles, tutorials, prevention guides (admin-managed)
- **Online Consultation** — Search dentists, book appointments, Jitsi video sessions
- **Admin Dashboard** — Analytics charts, user/content/appointment management

## Supported Disease Classes

1. Dental Calculus
2. Dental Caries
3. Gingivitis
4. Normal Teeth
5. Mouth Ulcer
6. Tooth Discoloration

## Security

- JWT authentication with refresh tokens
- Role-based access control (user, dentist, admin)
- bcrypt password hashing
- Helmet, CORS, rate limiting
- Input validation, XSS protection, MongoDB injection protection

## API Documentation

See [docs/API.md](docs/API.md) for complete REST API reference.

## Production Deployment

1. Set `NODE_ENV=production` in backend
2. Use strong JWT secrets
3. Configure SMTP for email features
4. Deploy MobileNetV3 model with your dataset (`mobilenetv3_checkpoint.keras`)
5. Use gunicorn for Flask: `gunicorn -w 4 -b 0.0.0.0:5001 app:app`
6. Build frontend: `npm run build` and serve via nginx/CDN

## License

MIT
