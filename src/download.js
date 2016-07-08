const net = require('net');
const tracker = require('./tracker');

module.exports = torrent => {
  tracker.getPeers(torrent, peers => {
    peers.forEach(download);
  });
};

/**
  Handshake format - <pstrlen><pstr><reserved><info_hash><peer_id>
  pstrlen: string length of <pstr>, as a single raw byte
  pstr: string identifier of the protocol
  reserved: eight (8) reserved bytes. ALl zeros
  peer_id: 20-byte string used as a unique ID for the client.
*/
/**
  All other messages format - 
  <length prefix><message ID><payload>
  The payload is message dependent
  length prefix is a 4byte big e value
  MSG id is single byte

  Keep alive <len=0000> send every two minutes
  choke: <len=0001><id=0>
  unchoke: <len=0001><id=1>
  interested: <len=0001><id=2>
  not interested: <len=0001><id=3>
  have: <len=0005><id=4><piece index>
  bitfield: <len=0001+X><id=5><bitfield>
*/

function download(peer) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    // socket.write(...) write a message here
  });
  socket.on('data', data => {
    // handle response here
  });
}