const passport = require('passport')
const { BasicStrategy } = require('passport-http')
const Boom = require('@hapi/boom')
const axios = require('axios')
const { config } = require('../../../config')

passport.use(
  new BasicStrategy(async (email, password, cb) => {
    try{
      const { data, status } = await axios({
        url: `${config.apiUrl}/api/auth/sign-in`,
        method: 'post',
        auth: {
            password,
            username: email
        },
        data: {
            apiKeyToken: config.apiKeyToken
        }
      })
      if(!data || status !== 200){
        return cb(Boom.unauthorized(), false)
      }
      return cb(null, data)
    }catch(err){
        cb(err)
    }
  })
)
