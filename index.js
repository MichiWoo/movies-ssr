const express = require("express")
const helmet = require('helmet')
const passport = require('passport')
const Boom = require('@hapi/boom')
const cookieParser = require('cookie-parser')
const axios = require('axios')
const { config } = require("./config")

const app = express()

// body parser
app.use(express.json())

// Helmet para la seguridad de los http
app.use(helmet())

app.use(cookieParser())

// Basic strategy
require('./utils/auth/strategies/basic')
// OAuth strategy
require('./utils/auth/strategies/oauth')

app.post("/auth/sign-in", async function(req, res, next) {
  passport.authenticate('basic', (err, data) => {
    const { token, user } = data
    try{
      if(err || !data){
        next(Boom.unauthorized())
      }
      req.login(data, { session: false }, async err => {
        if(err){
          next(err)
        }
        res.cookie('token', token, {
          httpOnly: !config.dev,
          secure: !config.dev
        })
        res.status(200).json(user)
      })
    }catch(err){
      next(err)
    }
  })(req, res, next)
})

app.post("/auth/sign-up", async function(req, res, next) {
  const { body: user } = req
  try{
    await axios({
      url: `${config.apiUrl}/api/auth/sign-up`,
      method: 'post',
      data: user
    })
    res.status(201).json({ message: 'user created' })
  }catch(err){
    next(err)
  }
})

app.get("/movies", async function(req, res, next) {

})

app.post("/user-movies", async function(req, res, next) {
  try{
    const { body: userMovie } = req
    const { token } = req.cookies
    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'post',
      data: userMovie
    })
    if(status !== 201){
      return next(Boom.badImplementation())
    }
    res.status(201).json(data)
  }catch(err){
    next(err)
  }
})

app.delete("/user-movies/:userMovieId", async function(req, res, next) {
  try{
    const { userMovieId } = req.params
    const { token } = req.cookies
    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'delete'
    })
    if(status !== 200){
      return next(Boom.badImplementation())
    }
    res.status(200).json(data)
  }catch(err){
    next(err)
  }
})

app.get(
  '/auth/google-oauth',
  passport.authenticate('google-oauth', { scope: ['email', 'profile', 'openid'] })
)

app.get(
  '/auth/google-oauth/callback',
  passport.authenticate('google-oauth', { session: false }),
  (req, res, next) => {
    if(!req.user){
      next(Boom.unauthorized())
    }
    const { token, ...user } = req.user
    res.cookie('token', token, {
      httpOnly: !config.dev,
      secure: !config.dev
    })
    res.status(200).json(user)
  }
)

app.listen(config.port, function() {
  console.log(`Listening http://localhost:${config.port}`)
})
