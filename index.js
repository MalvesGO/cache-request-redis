const express = require('express')
const axios = require('axios')
const redis = require('redis')
const responseTime = require('response-time')
const {promisify} = require('util')

const app = express()
app.use(responseTime())

const client = redis.createClient({
  host: 'localhost',
  port: 6379
})

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

app.get('/users', async (req, res, next) => {
  try {
    const reply = await GET_ASYNC('rockets')
    if(reply){
      console.log(`using cache data `)
      res.send(JSON.parse(reply))
      return
    }
    const response = await axios.get('https://randomuser.me/api/?results=5000')
    const saveResult = await SET_ASYNC('rockets', JSON.stringify(response.data), 'EX', 5)
    console.log('new data cached', saveResult)
    res.send(response.data)
  } catch (error) {
    res.send(error.message)
  }
})

app.get('/users/:id', async (req, res, next) => {
  try {
    const {id} = req.params;
    console.log(`id`, id)
    const reply = await GET_ASYNC(id)
    if(reply){
      console.log(`using cache data `)
      res.send(JSON.parse(reply))
      return
    }
    const response = await axios.get(`https://randomuser.me/api/?id=${id}`)
    const saveResult = await SET_ASYNC(id, JSON.stringify(response.data), 'EX', 5)
    console.log('new data cached', saveResult)
    res.send(response.data)
  } catch (error) {
    res.send(error.message)
  }
})

app.listen(3000, () => console.log('Rodando'))