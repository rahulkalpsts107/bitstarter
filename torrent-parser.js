const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

module.exports.open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent => {
  // ...
};

module.exports.infoHash = torrent => { //creates a sha1 hash of the info object 
  // ...
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
};