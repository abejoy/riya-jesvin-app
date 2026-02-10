# API Reference

Complete documentation of all "Our Story" timeline API endpoints.

## Base URLs

- **Production:**
  - API: `https://ourstory-api.yourdomain.com`
  - Frontend: `https://ourstory.yourdomain.com`

- **Development:**
  - API: `http://localhost:3001`
  - Frontend: `http://localhost:3000`

## Authentication

The API uses JWT tokens stored in httpOnly cookies for authentication.

### How to Get a Token

1. **Login:**

   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -H "Cookie: " \
     -d '{"username":"admin","password":"changeme"}'
   ```

2. **Response:**

   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Token is automatically stored in httpOnly cookie**
   - Subsequent requests will include it automatically
   - Browser handles this for you

### Token Expiration

- Tokens expire after **7 days**
- Automatic login renewal (refresh by making another request)

---

## Public Endpoints (No Auth Required)

### GET `/api/health`

Health check endpoint.

**Request:**

```bash
curl http://localhost:3001/api/health
```

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2024-02-10T10:30:45.123Z"
}
```

---

### GET `/api/memories`

Get all memories (timeline data).

**Request:**

```bash
curl http://localhost:3001/api/memories
```

**Response (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "First Date",
    "date": "2022-05-21",
    "section": "first_date",
    "body": "We went to that amazing restaurant in Paris. The sunset was beautiful and we talked for hours.",
    "location": "Paris",
    "sortOrder": 1,
    "images": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "url": "/uploads/550e8400-e29b-41d4-a716-446655440002.jpg",
        "width": 1920,
        "height": 1440,
        "alt": "sunset",
        "sortOrder": 1
      }
    ],
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
]
```

**Query Parameters:** None (gets all)

---

### GET `/api/memories/:id`

Get a specific memory by ID.

**Request:**

```bash
curl http://localhost:3001/api/memories/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "First Date",
  "date": "2022-05-21",
  "section": "first_date",
  "body": "...",
  "location": "Paris",
  "sortOrder": 1,
  "images": [...],
  "createdAt": "2024-01-15T10:30:45.123Z",
  "updatedAt": "2024-01-15T10:30:45.123Z"
}
```

**Response (404):**

```json
{
  "error": "Memory not found"
}
```

---

### GET `/api/valentine`

Get the Valentine's message (final timeline section).

**Request:**

```bash
curl http://localhost:3001/api/valentine
```

**Response (200):**

```json
{
  "title": "Happy Valentine's ❤️",
  "body": "Every moment with you is special. From the first time I saw you, I knew you were the one. Thank you for being my forever.",
  "signature": "— Us, Forever",
  "typedEffect": true,
  "updatedAt": "2024-02-01T15:20:30.000Z"
}
```

---

### GET `/uploads/:filename`

Get an uploaded image.

**Request:**

```bash
curl http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440002.jpg
```

**Response (200):**

- Binary image file
- Cache headers: `Cache-Control: public, max-age=2592000` (30 days)

**Response (404):**

```json
{
  "error": "File not found"
}
```

---

## Admin Endpoints (Auth Required)

### POST `/api/auth/login`

Login to get access token.

**Request:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "changeme"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**

```json
{
  "error": "Invalid credentials"
}
```

**Response (429 - Rate Limited):**

```json
{
  "error": "Too many login attempts"
}
```

---

### POST `/api/auth/logout`

Logout and clear session.

**Request:**

```bash
curl -X POST http://localhost:3001/api/auth/logout
```

**Response (200):**

```json
{
  "success": true
}
```

---

### GET `/api/auth/me`

Get current user info (verify auth).

**Request:**

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### POST `/api/memories`

Create a new memory.

**Request:**

```bash
curl -X POST http://localhost:3001/api/memories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Our Trip to London",
    "date": "2023-06-15",
    "section": "trips",
    "body": "Amazing week exploring the city. Big Ben, Tower Bridge, everything was perfect.",
    "location": "London"
  }'
```

**Request Body:**

```
{
  "title": string (required, 1-255 chars),
  "date": string (optional, ISO format: YYYY-MM-DD),
  "section": string (required, enum below),
  "body": string (required, markdown supported),
  "location": string (optional)
}
```

**Section Enum Values:**

- `first_meeting`
- `first_date`
- `trips`
- `engagement`
- `wedding`
- `inside_jokes`
- `other`

**Response (201):**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "message": "Memory created"
}
```

**Response (400):**

```json
{
  "error": "Title, section, and body are required"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### PUT `/api/memories/:id`

Update an existing memory.

**Request:**

```bash
curl -X PUT http://localhost:3001/api/memories/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Our Engagement",
    "date": "2023-12-25",
    "section": "engagement",
    "body": "He got down on one knee and asked me to marry him!",
    "location": "Home"
  }'
```

**Request Body:**

- All fields optional
- Only specified fields are updated
- Blank fields can be reset

**Response (200):**

```json
{
  "message": "Memory updated"
}
```

**Response (404):**

```json
{
  "error": "Memory not found"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### DELETE `/api/memories/:id`

Delete a memory and all associated images.

**Request:**

```bash
curl -X DELETE http://localhost:3001/api/memories/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "message": "Memory deleted"
}
```

**Response (404):**

```json
{
  "error": "Memory not found"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### POST `/uploads/:memoryId/images`

Upload images for a memory.

**Request (using curl):**

```bash
curl -X POST http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440000/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.png"
```

**Request (using JavaScript/Axios):**

```javascript
const formData = new FormData();
formData.append("files", file1);
formData.append("files", file2);

axios.post(`http://localhost:3001/uploads/${memoryId}/images`, formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});
```

**Constraints:**

- Max file size: 10MB per file
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max images per memory: 20

**Response (201):**

```json
{
  "images": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "url": "/uploads/550e8400-e29b-41d4-a716-446655440005.jpg",
      "width": 1920,
      "height": 1440
    }
  ]
}
```

**Response (400):**

```json
{
  "error": "Only image files are allowed"
}
```

**Response (413):**

```json
{
  "error": "File too large"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### DELETE `/uploads/:memoryId/images/:imageId`

Delete a specific image from a memory.

**Request:**

```bash
curl -X DELETE http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440000/images/880e8400-e29b-41d4-a716-446655440004 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "message": "Image deleted"
}
```

**Response (404):**

```json
{
  "error": "Image not found"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### PUT `/uploads/:memoryId/images/reorder`

Reorder images within a memory.

**Request:**

```bash
curl -X PUT http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440000/images/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order": [
      {"id": "880e8400-e29b-41d4-a716-446655440004", "sortOrder": 1},
      {"id": "990e8400-e29b-41d4-a716-446655440006", "sortOrder": 2}
    ]
  }'
```

**Request Body:**

```
{
  "order": [
    {
      "id": string (image ID),
      "sortOrder": number (1, 2, 3...)
    }
  ]
}
```

**Response (200):**

```json
{
  "message": "Images reordered"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### PUT `/api/memories/reorder`

Reorder all memories in timeline.

**Request:**

```bash
curl -X PUT http://localhost:3001/api/memories/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order": [
      {"id": "550e8400-e29b-41d4-a716-446655440000", "sortOrder": 1},
      {"id": "770e8400-e29b-41d4-a716-446655440003", "sortOrder": 2},
      {"id": "660e8400-e29b-41d4-a716-446655440001", "sortOrder": 3}
    ]
  }'
```

**Request Body:**

```
{
  "order": [
    {
      "id": string (memory ID),
      "sortOrder": number
    }
  ]
}
```

**Response (200):**

```json
{
  "message": "Memories reordered"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

### PUT `/api/valentine`

Update the Valentine's message.

**Request:**

```bash
curl -X PUT http://localhost:3001/api/valentine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Happy Valentine'\''s ❤️",
    "body": "My dearest love, every day with you is a gift. Thank you for making my life complete.",
    "signature": "Forever yours",
    "typedEffect": true
  }'
```

**Request Body:**

```
{
  "title": string (optional),
  "body": string (optional),
  "signature": string (optional),
  "typedEffect": boolean (optional, true/false)
}
```

**Response (200):**

```json
{
  "message": "Valentine message updated"
}
```

**Response (401):**

```json
{
  "error": "Unauthorized"
}
```

---

## Error Responses

### Common HTTP Status Codes

| Code | Meaning           | Example                 |
| ---- | ----------------- | ----------------------- |
| 200  | OK                | Request succeeded       |
| 201  | Created           | Memory/image created    |
| 400  | Bad Request       | Missing required field  |
| 401  | Unauthorized      | Invalid/missing token   |
| 404  | Not Found         | Memory/image not found  |
| 413  | Payload Too Large | File exceeds size limit |
| 429  | Too Many Requests | Rate limited (login)    |
| 500  | Server Error      | Unexpected error        |

### Standard Error Format

```json
{
  "error": "Human-readable error message"
}
```

---

## Rate Limiting

**Login endpoint:**

- 5 attempts per minute per IP
- Rate limit window: 60 seconds
- Response: 429 Too Many Requests

```json
{
  "error": "Too many login attempts"
}
```

---

## CORS Headers

The API includes the following CORS headers when properly configured:

```
Access-Control-Allow-Origin: https://ourstory.yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Example: Complete Flow

### 1. Initialize (First Time)

```bash
# Database is auto-initialized on first backend startup
# Admin user is created with credentials from .env
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

# Response includes token in cookie
# (automatic in browsers, manual management needed in CLI/API clients)
```

### 3. Create Memory

```bash
curl -X POST http://localhost:3001/api/memories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "First Kiss",
    "date": "2022-04-15",
    "section": "first_date",
    "body": "It was magical!",
    "location": "Paris"
  }'

# Response: {"id": "550e8400...", "message": "Memory created"}
```

### 4. Upload Images

```bash
curl -X POST http://localhost:3001/uploads/550e8400.../images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@kiss.jpg"

# Response: {"images": [{"id": "...", "url": "/uploads/..."}]}
```

### 5. View Timeline

```bash
# Frontend fetches
curl http://localhost:3001/api/memories

# Get images
curl http://localhost:3001/uploads/550e8400.../image.jpg

# Get valentine
curl http://localhost:3001/api/valentine
```

---

## Testing with cURL

### Save token in variable

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | jq -r '.token')

echo $TOKEN
```

### Use token in requests

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing with Postman

1. Create collection "Our Story API"
2. Create environment variable: `{{api_url}} = http://localhost:3001`
3. Create login request:
   - POST `{{api_url}}/api/auth/login`
   - Body: `{"username":"admin","password":"changeme"}`
   - Tests tab: `pm.environment.set("token", pm.response.json().token);`
4. Use token in other requests: `Authorization: Bearer {{token}}`

---

## Client Libraries

### JavaScript (Axios)

```javascript
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

// Login
const { data } = await client.post("/api/auth/login", {
  username: "admin",
  password: "changeme",
});

// Create memory
await client.post("/api/memories", {
  title: "Our Story",
  section: "first_meeting",
  body: "The beginning...",
  date: "2022-01-01",
});
```

### Python (Requests)

```python
import requests

session = requests.Session()
api_url = 'http://localhost:3001'

# Login
response = session.post(f'{api_url}/api/auth/login', json={
    'username': 'admin',
    'password': 'changeme'
})

# Create memory
response = session.post(f'{api_url}/api/memories', json={
    'title': 'Our Story',
    'section': 'first_meeting',
    'body': 'The beginning...'
})
```

---

## Webhook Events (Future Enhancement)

Currently not implemented but could be added:

```
POST /api/webhooks
POST /api/webhooks/:id
DELETE /api/webhooks/:id

Events:
- memory.created
- memory.updated
- memory.deleted
- image.uploaded
- valentine.updated
```

---

**Last Updated: February 2024**
