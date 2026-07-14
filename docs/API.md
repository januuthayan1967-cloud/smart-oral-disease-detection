# Smart Oral Disease Detection API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "age": 30,
  "gender": "male",
  "role": "user"
}
```

### POST /auth/login
**Body:** `{ "email", "password" }`

### POST /auth/refresh-token
**Body:** `{ "refreshToken" }`

### POST /auth/forgot-password
**Body:** `{ "email" }`

### POST /auth/reset-password
**Body:** `{ "token", "password" }`

### GET /auth/verify-email?token=xxx

### GET /auth/profile
Protected. Returns current user profile.

### PUT /auth/profile
Protected. Update profile fields.

### POST /auth/logout
Protected. Invalidate refresh token.

---

## Prediction Endpoints

### POST /predict
Protected. Upload oral image (multipart/form-data, field: `image`).

### GET /predictions
Protected. List user's predictions (admin sees all).

### GET /predictions/:id
Protected. Get prediction details.

### DELETE /predictions/:id
Protected. Delete prediction.

---

## Report Endpoints

### GET /reports
Protected. List reports.

### GET /reports/:id
Protected. Get report metadata.

### GET /reports/download/:id
Protected. Download PDF report.

---

## Chat Endpoints

### POST /chat
Protected. **Body:** `{ "message" }`

### GET /chat/history
Protected. Get chat history.

---

## Education Endpoints

### GET /education?category=brushing
Public. List educational content.

### POST /education
Admin only. Create content.

### PUT /education/:id
Admin only. Update content.

### DELETE /education/:id
Admin only. Delete content.

---

## Dentist Endpoints

### GET /dentists?search=&specialization=
Public. List dentists.

### GET /dentists/:id
Public. Get dentist details.

### POST /dentists
Dentist/Admin. Create dentist profile.

---

## Appointment Endpoints

### POST /appointments
Protected. **Body:**
```json
{
  "dentistId": "...",
  "appointmentDate": "2026-06-20",
  "appointmentTime": "10:00",
  "notes": "optional"
}
```

### GET /appointments
Protected. List appointments (role-based filtering).

### PUT /appointments/:id
Protected. Update status/date/time.

---

## Admin Endpoints

### GET /admin/dashboard
Admin only. Dashboard stats and charts.

### GET /admin/users
Admin only. List all users.

### PUT /admin/users/:id/role
Admin only. **Body:** `{ "role": "admin|dentist|user" }`

### DELETE /admin/users/:id
Admin only. Delete user.

---

## Health Check

### GET /health
Returns API status.

---

## Socket.io Events

- `chat:message` → Send chat message
- `chat:response` → Receive bot response

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```
