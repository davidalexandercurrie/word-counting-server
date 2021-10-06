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
const endpointURLUserName = 'https://api.twitter.com/2/users/by/username/';
const WordPOS = require('wordpos'),
  wordpos = new WordPOS();

app.use(cors());
app.use('/', express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('msg', async data => {
    let username = data[1];
    let settings = data[0];

    //api request
    console.log('socket msg received!');
    const userId = await needle('get', endpointURLUserName + username, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    console.log(userId.body.data.id);
    const endpointURL = `https://api.twitter.com/2/users/${userId.body.data.id}/tweets?`;
    const params = {
      max_results: 100,
    };
    const res = await needle('get', endpointURL, params, {
      headers: {
        'User-Agent': 'v2TweetLookupJS',
        authorization: `Bearer ${token}`,
      },
    });
    if (res.body) {
      console.log(`Receiving ${username}'s last Tweets`);
      let data = '';
      res.body.data.forEach(element => {
        data += element.text;
      });
      let newArr = data.split(/[\s.,!?":/]/g);
      let filteredArr = [];
      // let data = [[noun, adjective, mention, emoji], text];
      if (settings.includes(true)) {
        console.log('true');
        wordpos.getPOS(newArr.join(' '), result => {
          console.log(result);
          if (settings[0]) {
            filteredArr.concat(result.nouns);
          }
          if (settings[1]) {
            filteredArr.concat(result.adjectives);
            console.log(object);
          }
          let counts = {};
          let keys = [];
          for (let i = 0; i < filteredArr.length; i++) {
            let word = filteredArr[i].toLowerCase();
            if (
              counts[word] === undefined &&
              word !== '' &&
              word !== 't' &&
              word !== 'co'
            ) {
              counts[word] = 1;
              keys.push(word);
            } else {
              counts[word] = counts[word] + 1;
            }
          }
          keys.sort(compare);

          function compare(a, b) {
            var countA = counts[a];
            var countB = counts[b];
            return countB - countA;
          }

          let dataToSend = { keys, counts };

          io.to(socket.id).emit('event', dataToSend);
        });

        // if (settings[2]) {
        //   //
        // }
        // if (settings[3]) {
        // }
        console.log(newArr);
        // return new array
      } else {
        let counts = {};
        let keys = [];
        for (let i = 0; i < newArr.length; i++) {
          let word = newArr[i].toLowerCase();
          if (
            counts[word] === undefined &&
            word !== '' &&
            word !== 't' &&
            word !== 'co'
          ) {
            counts[word] = 1;
            keys.push(word);
          } else {
            counts[word] = counts[word] + 1;
          }
        }
        keys.sort(compare);

        function compare(a, b) {
          var countA = counts[a];
          var countB = counts[b];
          return countB - countA;
        }

        let dataToSend = { keys, counts };

        io.to(socket.id).emit('event', dataToSend);
        // return original array
      }
    } else {
      throw new Error('Unsuccessful request');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log('listening on *:3000');
});
