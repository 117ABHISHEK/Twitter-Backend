//app.js

const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.use(express.json())

const dbPath = path.join(__dirname, 'twitterClone.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('Server running on 3000'))
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization']
  if (authHeader === undefined) {
    return response.status(401).send('Invalid JWT Token')
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, 'abhishek', (error, payload) => {
    if (error) {
      response.status(401).send('Invalid JWT Token')
    } else {
      request.username = payload.username
      next()
    }
  })
}

// API 1 - Register
app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const user = await db.get('SELECT * FROM user WHERE username = ?', [username])
  if (user) {
    return response.status(400).send('User already exists')
  }
  if (password.length < 6) {
    return response.status(400).send('Password is too short')
  }
  const hashedPass = await bcrypt.hash(password, 10)
  await db.run(
    'INSERT INTO user (username, password, name, gender) VALUES (?, ?, ?, ?)',
    [username, hashedPass, name, gender],
  )
  response.status(200).send('User created successfully')
})

// API 2 - Login
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const user = await db.get('SELECT * FROM user WHERE username = ?', [username])
  if (!user) {
    return response.status(400).send('Invalid user')
  }
  const isPassValid = await bcrypt.compare(password, user.password)
  if (!isPassValid) {
    return response.status(400).send('Invalid password')
  }
  const payload = {username: username}
  const jwtToken = jwt.sign(payload, 'abhishek')
  response.send({jwtToken})
})

const getUserId = async username => {
  const user = await db.get('SELECT user_id FROM user WHERE username = ?', [
    username,
  ])
  return user.user_id
}

// API 3
app.get('/user/tweets/feed/', authenticateToken, async (request, response) => {
  const userId = await getUserId(request.username)
  const tweets = await db.all(
    `SELECT username, tweet, date_time AS dateTime
     FROM follower INNER JOIN tweet ON follower.following_user_id = tweet.user_id
     INNER JOIN user ON user.user_id = tweet.user_id
     WHERE follower.follower_user_id = ?
     ORDER BY date_time DESC
     LIMIT 4;`,
    [userId],
  )
  response.send(tweets)
})

// API 4
app.get('/user/following/', authenticateToken, async (request, response) => {
  const userId = await getUserId(request.username)
  const following = await db.all(
    `SELECT name FROM user WHERE user_id IN (
      SELECT following_user_id FROM follower WHERE follower_user_id = ?
    );`,
    [userId],
  )
  response.send(following)
})

// API 5
app.get('/user/followers/', authenticateToken, async (request, response) => {
  const userId = await getUserId(request.username)
  const followers = await db.all(
    `SELECT name FROM user WHERE user_id IN (
      SELECT follower_user_id FROM follower WHERE following_user_id = ?
    );`,
    [userId],
  )
  response.send(followers)
})

// API 6
app.get('/tweets/:tweetId/', authenticateToken, async (request, response) => {
  const {tweetId} = request.params
  const userId = await getUserId(request.username)
  const tweetOwner = await db.get(
    'SELECT user_id FROM tweet WHERE tweet_id = ?',
    [tweetId],
  )
  const isFollowing = await db.get(
    'SELECT * FROM follower WHERE follower_user_id = ? AND following_user_id = ?',
    [userId, tweetOwner.user_id],
  )
  if (!isFollowing) return response.status(401).send('Invalid Request')
  const tweetDetails = await db.get(
    `SELECT tweet, COUNT(DISTINCT like_id) AS likes,
            COUNT(DISTINCT reply_id) AS replies,
            date_time AS dateTime
     FROM tweet
     LEFT JOIN like ON tweet.tweet_id = like.tweet_id
     LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id
     WHERE tweet.tweet_id = ?
     GROUP BY tweet.tweet_id`,
    [tweetId],
  )
  response.send(tweetDetails)
})

// API 7
app.get(
  '/tweets/:tweetId/likes/',
  authenticateToken,
  async (request, response) => {
    const {tweetId} = request.params
    const userId = await getUserId(request.username)
    const tweet = await db.get('SELECT user_id FROM tweet WHERE tweet_id = ?', [
      tweetId,
    ])
    const isFollowing = await db.get(
      'SELECT * FROM follower WHERE follower_user_id = ? AND following_user_id = ?',
      [userId, tweet.user_id],
    )
    if (!isFollowing) return response.status(401).send('Invalid Request')
    const likes = await db.all(
      `SELECT username FROM user
     INNER JOIN like ON user.user_id = like.user_id
     WHERE tweet_id = ?`,
      [tweetId],
    )
    response.send({likes: likes.map(like => like.username)})
  },
)

// API 8
app.get(
  '/tweets/:tweetId/replies/',
  authenticateToken,
  async (request, response) => {
    const {tweetId} = request.params
    const userId = await getUserId(request.username)
    const tweet = await db.get('SELECT user_id FROM tweet WHERE tweet_id = ?', [
      tweetId,
    ])
    const isFollowing = await db.get(
      'SELECT * FROM follower WHERE follower_user_id = ? AND following_user_id = ?',
      [userId, tweet.user_id],
    )
    if (!isFollowing) return response.status(401).send('Invalid Request')
    const replies = await db.all(
      `SELECT name, reply FROM reply
     NATURAL JOIN user
     WHERE tweet_id = ?`,
      [tweetId],
    )
    response.send({replies})
  },
)

// API 9
app.get('/user/tweets/', authenticateToken, async (request, response) => {
  const userId = await getUserId(request.username)
  const tweets = await db.all(
    `SELECT tweet, COUNT(DISTINCT like_id) AS likes,
            COUNT(DISTINCT reply_id) AS replies,
            date_time AS dateTime
     FROM tweet
     LEFT JOIN like ON tweet.tweet_id = like.tweet_id
     LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id
     WHERE tweet.user_id = ?
     GROUP BY tweet.tweet_id`,
    [userId],
  )
  response.send(tweets)
})

// API 10
app.post('/user/tweets/', authenticateToken, async (request, response) => {
  const {tweet} = request.body
  const userId = await getUserId(request.username)
  const dateTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await db.run(
    'INSERT INTO tweet (tweet, user_id, date_time) VALUES (?, ?, ?)',
    [tweet, userId, dateTime],
  )
  response.send('Created a Tweet')
})

// API 11
app.delete(
  '/tweets/:tweetId/',
  authenticateToken,
  async (request, response) => {
    const {tweetId} = request.params
    const userId = await getUserId(request.username)
    const tweet = await db.get('SELECT * FROM tweet WHERE tweet_id = ?', [
      tweetId,
    ])
    if (tweet.user_id !== userId)
      return response.status(401).send('Invalid Request')
    await db.run('DELETE FROM tweet WHERE tweet_id = ?', [tweetId])
    response.send('Tweet Removed')
  },
)

module.exports = app
