const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const httpServer = http.createServer(app);
const needle = require('needle');
const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'https://davidalexandercurrie.com',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3000;
const path = require('path');
const token = process.env.bearer_token;
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
// const endpointURL = 'https://api.twitter.com/2/users/44196397/tweets?';
const endpointURL =
  'https://api.twitter.com/2/users/819717383975739392/tweets?';
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('msg', async () => {
    //api request
    console.log('socket msg received!');
    const params = {
      max_results: 40,
    };
    const res = await needle('get', endpointURL, params, {
      headers: {
        'User-Agent': 'v2TweetLookupJS',
        authorization: `Bearer ${token}`,
      },
    });
    if (res.body) {
      console.log(`Receiving Elon's last Tweets`);
      let data = '';
      res.body.data.forEach(element => {
        data += element.text;
        console.log(data);
      });
      let arr = tokenizer.tokenize(data);
      const array = [...str.matchAll(/@\w+/)];
      let newArr = array.concat(arr);
      io.to(socket.id).emit('event', newArr);
    } else {
      throw new Error('Unsuccessful request');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log('listening on *:3000');
});
