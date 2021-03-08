const path = require('path')
const express = require('express')


const app = express()

const publicDirectory = path.join(__dirname, '../public')
app.use(express.static(publicDirectory))

app.get('/', (req, res) => {
    res.sendFile('index.html')
})

module.exports = app