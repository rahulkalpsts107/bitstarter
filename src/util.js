const crypto = require('crypto');

let id = null;

module.exports.genId = () => {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from('-RK0001-').copy(id, 0);//peer id random 20 bytes
  }
  return id;
};