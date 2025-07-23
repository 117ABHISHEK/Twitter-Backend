
# 🐦 Twitter Clone API

This is a full-fledged **Twitter Clone REST API** built using **Node.js**, **Express.js**, and **SQLite**. It handles user registration, login, tweet feed management, following/followers logic, tweet posting, deletion, likes, and replies.

## 🚀 Features

- User Registration & Login with JWT Auth
- View feed from followed users
- View list of followers and following
- Like, Reply, and Delete Tweets
- Post new Tweets
- Secure routes with JWT Authentication

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT
- **Password Security**: bcrypt

---

## 📂 Project Structure

```
twitterClone/
├── app.js               # Main server and routes
├── twitterClone.db      # SQLite database file
├── package.json
├── package-lock.json
└── README.md
```

---

## 📦 Installation

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/twitterClone.git
cd twitterClone
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start the Server**
```bash
node app.js
```

> Server runs on **http://localhost:3000**

---

## 🔐 Authentication

Use the **JWT Token** returned from `/login/` in the `Authorization` header for protected routes.

```
Authorization: Bearer <jwt_token>
```

---

## 📘 API Endpoints

### ✅ Register a New User

**POST** `/register/`
```json
{
  "username": "johndoe",
  "password": "mypassword",
  "name": "John Doe",
  "gender": "male"
}
```

---

### 🔓 Login

**POST** `/login/`
```json
{
  "username": "johndoe",
  "password": "mypassword"
}
```

**Returns:**
```json
{
  "jwtToken": "<token>"
}
```

---

### 📰 Get Tweet Feed (Latest 4 from Following)

**GET** `/user/tweets/feed/` *(Protected)*

---

### 👥 Get Following List

**GET** `/user/following/` *(Protected)*

---

### 👣 Get Followers List

**GET** `/user/followers/` *(Protected)*

---

### 🧵 Get Tweet Details (likes, replies, time)

**GET** `/tweets/:tweetId/` *(Protected)*

---

### ❤️ Get Users Who Liked a Tweet

**GET** `/tweets/:tweetId/likes/` *(Protected)*

---

### 💬 Get Replies to a Tweet

**GET** `/tweets/:tweetId/replies/` *(Protected)*

---

### 🧾 Get All Tweets of Logged-in User

**GET** `/user/tweets/` *(Protected)*

---

### ✍️ Create a New Tweet

**POST** `/user/tweets/` *(Protected)*
```json
{
  "tweet": "Hello, Twitter!"
}
```

---

### ❌ Delete Your Tweet

**DELETE** `/tweets/:tweetId/` *(Protected)*

---

## 🧪 Sample Database Schema

Ensure your database (`twitterClone.db`) has the following tables:

- `user(user_id, username, password, name, gender)`
- `tweet(tweet_id, tweet, user_id, date_time)`
- `follower(follower_user_id, following_user_id)`
- `like(like_id, tweet_id, user_id)`
- `reply(reply_id, tweet_id, user_id, reply)`

> You can use a pre-seeded `.db` file or create migrations using SQLite CLI or any GUI (like DB Browser for SQLite).

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 🧠 Author

**Abhishek** – [GitHub](https://github.com/117ABHISHEK)

---

## 📜 License

This project is licensed under the **MIT License**.
