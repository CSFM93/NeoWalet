const express = require("express");
const app = express();
const telegramBot = require('./telegramBot')
const discordBot = require('./discordBot')
const whatsappBot = require('./whatsappBot')

const port = 3042;


const http = require("http");
const server = http.createServer( app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())


app.use('/', whatsappBot.router);


io.on('connection', (socket) => {
    console.log('user connected')
    socket.on('addAccount',async ( msg) => {
        console.log('message: ', msg)
        let data = JSON.parse(msg)

        if(data.platform === "discord"){
            let WIFAdded = await discordBot.changeAccountAddingState(data)
            io.emit('addAccountState', WIFAdded);
        }else if(data.platform === "telegram"){
            let WIFAdded = await telegramBot.changeAccountAddingState(data)
            io.emit('addAccountState', WIFAdded);
        }else{
            let WIFAdded = await whatsappBot.changeAccountAddingState(data)
            io.emit('addAccountState', WIFAdded);
        }

    });
    socket.on('login', async ( msg) => {
        console.log('message: ', msg)
        let data = JSON.parse(msg)
        if(data.platform === "discord"){
            let loginSuccessful = await discordBot.changeLoginState(data)
            io.emit('loginState', loginSuccessful);
        }else if(data.platform === "telegram"){
            let loginSuccessful = await telegramBot.changeLoginState(data)
            io.emit('loginState', loginSuccessful);
        }else{ 
            let loginSuccessful = await whatsappBot.changeLoginState(data)
            io.emit('loginState', loginSuccessful);
        }

    });

});


app.get('/api/ping', (req, res) => {
    try {
        res.status(200).json({ isRunning: true });
    } catch (error) {
        res.status(200).json({ error: true, message: error })
    }
});

server.listen(port, () => console.log(`Server is running on port ${port}`));