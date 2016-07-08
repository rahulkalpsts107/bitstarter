const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser');
const util = require('./util');
/**
1. Connect request
2. Connect response
3. Announce request
4. Announce response
*/
function _getPeers (torrent, callback) {
  const socket = dgram.createSocket('udp4');
  const url = torrent.announce.toString('utf8');

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      console.log("connResp has come ")
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      console.log("announceResp seeders  "+announceResp.seeders)
      console.log("announceResp leechers "+announceResp.leechers)
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {
  // ...
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
}

function buildConnReq() {
  //Connection request format
  //Offset  Size            Name            Value
	//0       64-bit integer  connection_id   0x41727101980
	//8       32-bit integer  action          0 // connect
	//12      32-bit integer  transaction_id  ? // random
	//16
	const buf = Buffer.alloc(16); // 2 allocate 16 bytes

	// connection id , need to split into chunks of 32 bit
	//ALl data in big endian format
	buf.writeUInt32BE(0x417, 0); // 3
	buf.writeUInt32BE(0x27101980, 4);
	// action
	buf.writeUInt32BE(0, 8); // 4 connect
	// transaction id
	crypto.randomBytes(4).copy(buf, 12); // 5 write 4 bytes from 12th byte start

	return buf;
}

function parseConnResp(resp) {
  	// ...
  	//Offset  Size            Name            Value
	// 0       32-bit integer  action          0 // connect
	// 4       32-bit integer  transaction_id
	// 8       64-bit integer  connection_id
	// 16

	return {
		action: resp.readUInt32BE(0),
	    transactionId: resp.readUInt32BE(4),
	    connectionId: resp.slice(8)
	}
}

/**
Offset  Size    Name    Value
0       64-bit integer  connection_id
8       32-bit integer  action          1 // announce
12      32-bit integer  transaction_id
16      20-byte string  info_hash
36      20-byte string  peer_id
56      64-bit integer  downloaded
64      64-bit integer  left
72      64-bit integer  uploaded
80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
84      32-bit integer  IP address      0 // default
88      32-bit integer  key             ? // random
92      32-bit integer  num_want        -1 // default
96      16-bit integer  port            ? // should be betwee
98
*/
function buildAnnounceReq(connId, torrent, port=6881) {
  // ...
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 84);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

/**
	Offset      Size            Name            Value
	0           32-bit integer  action          1 // announce
	4           32-bit integer  transaction_id
	8           32-bit integer  interval
	12          32-bit integer  leechers
	16          32-bit integer  seeders
	20 + 6 * n  32-bit integer  IP address  // first 4 bytes ip address and next 2 bytes port
	24 + 6 * n  16-bit integer  TCP port
	20 + 6 * N
*/

function parseAnnounceResp(resp) {
  // ...
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}

var exportTracker = {
	getPeers: _getPeers
};

module.exports = exportTracker;