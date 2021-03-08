const app = require('./app')
const http = require('http')
const socketio = require('socket.io')

const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const port = process.env.PORT

// Create a new web server and pass our application
const server = http.createServer(app)

const io = socketio(server)     // create instance and pass in the server

io.on('connection', (socket) => {
    const admin = 'Admin'

    /**
     * 
     */

    socket.on('join', ({username, room}, callback)=> {

        const {error, user} = addUser({id: socket.id, username, room})
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage(admin, 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(admin, `${user.username} has joined!`))
    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, message))
            callback()
        }
    })

    socket.on('sendLocation', ({latitude, longitude}={}, callback)=> {

        const user = getUser(socket.id)
        if (user) {
            if (!latitude || !longitude)
                return callback('Location is not available')

            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com.au/maps/@-${latitude},${longitude},16z`))
            callback(undefined, 'Location shared')
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(admin, `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, ()=>{
    console.log(`The server is running on port ${port}`)
})