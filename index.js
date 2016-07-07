'use strict';
const fs = require('fs');
var bencode = require('bencode');
var tracker = require('./tracker');
const torrentParser = require('./torrent-parser');

const torrent = torrentParser.open('puppy.torrent');

// var data = {
//   string: 'Hello World',
//   integer: 12345,
//   dict: {
//     key: 'This is a string within a dictionary'
//   },
//   list: [ 1, 2, 3, 4, 'string', 5, {} ]
// }

// var result = bencode.encode( data )
//console.log(result.toString())

tracker.getPeers(torrent, peers => {
  console.log('list of peers: ', peers);
});