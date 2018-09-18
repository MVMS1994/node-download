const fs    = require('fs');
const path  = require('path');


module.exports = (count, destination) => {
  for(var i = 0; i < count; i++) {
    fs.appendFileSync(destination, fs.readFileSync('temp/temp_' + i));
  }
}