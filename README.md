# Instagram Clone

A scalable Instagram-like social media application built with Node.js, Express, Redis, and MongoDB.

## Features

### Authentication
- User registration
- Login / Logout
- JWT authentication
- Password hashing with bcrypt
- Password reset

### User Management
- Edit profile
- Follow users
- Unfollow users
- View followers/following

### Posts
- Upload photos
- Add captions
- Delete posts
- Like posts
- Comment on posts

### Feed
- Personalized user feed
- Cached feeds using Redis
- Infinite scrolling support

### Notifications
- Like notifications
- Comment notifications
- Follow notifications
- Redis Pub/Sub for real-time updates

### Security
- JWT authentication
- Rate limiting
- Input validation
- Helmet security headers

---

## Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Redis

### Storage
- Cloudinary / AWS S3

### Authentication
- JWT
- bcrypt

---

## Project Structure

src/
│
├── config/
│ ├── db.js
│ ├── redis.js
│
├── controllers/
│ ├── auth.controller.js
│ ├── user.controller.js
│ ├── post.controller.js
│
├── middleware/
│ ├── auth.js
│ ├── rateLimiter.js
│
├── models/
│ ├── User.js
│ ├── Post.js
│ ├── Comment.js
│
├── routes/
│ ├── auth.routes.js
│ ├── user.routes.js
│ ├── post.routes.js
│
├── services/
│ ├── feed.service.js
│ ├── notification.service.js
│
├── utils/
│ ├── cloudinary.js
│
├── app.js
└── server.js

---

## Installation

### Clone Repository

git clone https://github.com/yourusername/socialsync.git

cd instagram-clone

### Install Dependencies

npm install

### Start Redis

docker run -p 6379:6379 redis

or

redis-server

### Configure Environment Variables

Create a .env file:

PORT=5000

MONGO_URI=mongodb://localhost:27017/instagram_clone

JWT_SECRET=your_secret_key

REDIS_HOST=localhost

REDIS_PORT=6379

CLOUDINARY_CLOUD_NAME=xxxxx

CLOUDINARY_API_KEY=xxxxx

CLOUDINARY_API_SECRET=xxxxx

### Run Development Server

npm run dev

---

## API Endpoints

### Auth

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

### Users

GET /api/users/:id

PUT /api/users/profile

POST /api/users/follow/:id

POST /api/users/unfollow/:id

### Posts

POST /api/posts

GET /api/posts/feed

GET /api/posts/:id

DELETE /api/posts/:id

### Likes

POST /api/posts/:id/like

POST /api/posts/:id/unlike

### Comments

POST /api/posts/:id/comments

GET /api/posts/:id/comments

---

## Redis Usage

### Feed Cache

User feeds are cached:

feed:user:123

TTL = 300 seconds

Example:

await redis.setEx(
  `feed:user:${userId}`,
  300,
  JSON.stringify(feed)
);

### Session Storage

session:user:123

### Rate Limiting

rate_limit:login:ip_address

### Notifications

Redis Pub/Sub Channels:

notifications

Example:

publisher.publish(
  "notifications",
  JSON.stringify({
    userId,
    type: "LIKE",
    postId
  })
);

---

## Environment Variables

PORT=
MONGO_URI=
JWT_SECRET=

REDIS_HOST=
REDIS_PORT=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

---

## Future Enhancements

- Stories
- Reels
- Direct Messaging
- Video Uploads
- Search Engine
- Hashtags
- User Mentions
- WebSockets
- Microservices Architecture

---

## Performance Optimizations

### Redis Feed Caching

Reduces database queries by caching user feeds.

### Lazy Loading

Pagination and infinite scrolling.

### Queue Processing

Redis Streams / BullMQ for:

- Notifications
- Email sending
- Image processing

---

## Deployment

### Docker

docker-compose up -d

### Production Stack

- Nginx
- Node.js Cluster Mode
- Redis
- MongoDB Atlas
- Cloudinary
- PM2

---

## License

MIT License

## Author

Your Name
