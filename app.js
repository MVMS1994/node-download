var axios = require("axios");
var fs    = require("fs");
var https = require("https");
var cp    = require("child_process");

var merge = require("./merge");

var input = {
  url: 'https://content-aapm1.uplynk.com/6b1f651bbcfd4d08bbf4b8b8717a5dfe/g.m3u8?rays=cdefg&hlsver=5&tc=1&exp=1537171621&rn=300516&ct=a&eid=PYO16759B02&oid=682389d3b3e244a5bd4b9853036d1eff&euid=54A53B5A-11C5-4FB5-BD67-72D8D1AF2E5B&platform=web&platformDetail=&sig=e9497fa92766ec57b6e2698ea08e2a06343700095b34c5c4342a841665422fa9&pbs=12201adc84df49afb10d7e0296c30459',
  output: 'output',
  codec: 'm3u8'
}

var options = {
  method: 'get',
  url: input.url,
  responseType: getResponseType(input.codec)
}

function getResponseType(codec) {
  switch(codec) {
    case "m3u8": return "text";
    default: return "stream"
  }
}

var instance = axios.create({
  httpsAgent: new https.Agent({ keepAlive: true }),
  responseType: "stream"
});

async function tsFileHandler(url, i) {
  return new Promise(function(resolve, reject) {
    console.log("downloading: " + url);
    instance.get(url).then(function(res) {
      res.data.pipe(fs.createWriteStream("temp/temp_" + i));
      resolve("success");
    }).catch(function(error) {
      console.error("error at " + i, error);
      console.error("failed url: ", url);
      resolve("failed");
    });
  });
}

var m3u8Handler = function(response) {
  var lines = response.data.split("\n");
  if(lines[0] != "#EXTM3U") {
    console.error("invalid extension " + lines[0]);
    process.exit(0);
  }
  var urls = lines.filter((line) => !line.trim().startsWith("#") && line.trim() != "");
  var count = 0;
  for(var i in urls) {
    count += (await tsFileHandler(urls[i], i) == "success") ? 1 : 0;
  }

  if(count != url.length) {
    console.error("error in downloading some files");
    process.exit(1);
  }

  merge(count, input.output + ".ts");
  console.log(cp.execSync('ffmpeg -i ' + input.output + '.ts -acodec copy -vcodec copy ' + input.output + '.mp4').toString('UTF-8'));
}

var processOutput = async function(response) {
  if(response.status != 200) {
    console.error("status code: " + response.status)
    console.error("status text: " + response.statusText)
    process.exit(10);
  }

  if(input.codec == 'm3u8') {
    m3u8Handler(response);
  } else {
    response.data.pipe(fs.createWriteStream(input.output))
  }
}

axios(options).then(processOutput);