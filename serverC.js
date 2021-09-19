var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var bcrypt = require('bcrypt');
var http = require('http');
var Web3 = require('web3');
var schedule = require('node-schedule');
var ethers = require('ethers');
var web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545"));
//app.use(cors())
//mongoose.connect('mongodb://localhost/BalloonDB');
mongoose.connect('mongodb://192.168.3.118:27017/BalloonDB');
var activeList = [];
var loginList = {};
var popCount = 0;

const abi = [{ "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }, { "name": "user", "type": "bytes32" }, { "name": "userAddress", "type": "address" }, { "name": "newBalance", "type": "uint256" }], "name": "withdraw", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "bytes32" }], "name": "PlayerBalances", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "sender", "type": "address" }], "name": "changeAdmin", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "user", "type": "bytes32" }], "name": "deposit", "outputs": [{ "name": "success", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": true, "inputs": [], "name": "admin", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [], "payable": true, "stateMutability": "payable", "type": "constructor" }];

var contractAddress = "0xE537F53D5C045Eae39cf4Ca308605b26eB5e85E1";
var adminWallet = '0x28cAf49F02904e4620524561888a7820FB47Ca35';
const privateKey = 'f3ca3bf3af0372cbcb951617bfbfaa53f372b3e6d61c87c1dfd094beba9ef8d5';



var balloonContract = new web3.eth.Contract(abi, contractAddress,
    {
  from: adminWallet, // default from address
  gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
}
);


const crypto = require('crypto');
//const hash = crypto.createHash('sha256');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
  res.header('Access-Control-Expose-Headers', 'Authorization');
  next();
});

var userSchema = require('./models/Users').userSchema;
var orderSchema = require('./models/Orders').orderSchema;


function getPopCount() {
  fs.readFile("./popCount.txt", { encoding: 'utf-8' }, function (err, data) {
    if (!err) {
      console.log('Pop Count: ' + data);
      popCount = data;
    } else {
      console.log(err);
    }
  });
}

function setPopCount() {
  console.log("Pop Count: " + popCount)
  fs.writeFileSync("./popCount.txt", popCount);
}

getPopCount();

// for sync balloons
var balloonCount = 5;
var balloonSpeeds = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
var balloonPosition = [{ x: 0, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 1 }];
var balloonStart = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
var balloonAngular = [0, 0, 0, 0, 0];
var balloonDirection = [{ x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: -1 }];
for (var i = 0; i < balloonCount; i++) {
  balloonSpeeds[i].x = (Math.random() / 1000 + 0.001 + 0.0005 * i);
  balloonSpeeds[i].y = (Math.random() / 1000 + 0.005 + 0.0005 * i);

  balloonPosition[i].x = (Math.random() / 5 * i + 0.2);
  balloonPosition[i].y = 1 + i + 0.3;

  balloonStart[i].x = balloonPosition[i].x;
  balloonStart[i].y = balloonPosition[i].y;

  balloonAngular[i] = 150 + Math.random() * 80;
}
setInterval(function () {
  for (var i = 0; i < balloonCount; i++) {
    balloonPosition[i].x += balloonDirection[i].x * balloonSpeeds[i].x;
    balloonPosition[i].y += balloonDirection[i].y * balloonSpeeds[i].y;
    if (balloonPosition[i].x > 1) {
      balloonPosition[i].x = 0;
    }
    else if (balloonPosition[i].x < 0) {
      balloonPosition[i].x = 1;
    }
    if (balloonPosition[i].y < 0) {
      balloonPosition[i].y = balloonStart[i].y;
      balloonPosition[i].x = balloonPosition[i].x;
      balloonDirection[i].x = balloonDirection[i].x * -1;
    }
  }
}, 1000 / 64);
// end sync balloons

var server = http.createServer(app);
var io = require('socket.io').listen(server);
var messages = [];
io.on('connection', function (socket) {
  var sessionId = socket.id;
  io.emit("HISTORY", messages);
  socket.on('disconnect', function () {
    console.log('Got disconnect!' + socket.id);
    var index = activeList.findIndex((e) => e.sessionId == socket.id);
    var User = mongoose.model('Users', orderSchema);
    if (index != -1) {
      console.log(activeList[index])
      User.findOne({ userhash: activeList[index].username }, function (err, usr) {
        usr.balance += activeList[index].won - activeList[index].spent;
        usr.save(function () {
          activeList.splice(index, 1);
          io.emit("ADD", { count: activeList.length })
        });
        loginList[usr.userhash] = false;
      });
    }
    if (loginList[socket.id]) {
      console.log("logout");
      User.findOne({ userhash: loginList[socket.id] }, function (err, usr) {
        delete loginList[usr.userhash];
        delete loginList[socket.id];
      });
    }
  });

  socket.on('CHAT', function (message) {
    message.date = Date.now();
    console.log(message);
    messages.push(message);
    io.emit("CHAT", message);
  });

  socket.on('POP', function (idx) {
    io.emit("POP", {
      position: balloonPosition,
      speed: balloonSpeeds,
      direction: balloonDirection,
      index: idx
    });
    setTimeout(function () {
      balloonPosition[idx].x = balloonStart[idx].x;
      balloonPosition[idx].y = balloonStart[idx].y;
      balloonDirection[idx].x = balloonDirection[idx].x * -1;
      io.emit("RESETBALLOON", {
        position: balloonPosition,
        speed: balloonSpeeds,
        direction: balloonDirection,
        index: idx
      });
    }, 200);
  });
});

var isProcessing = false;
var j = schedule.scheduleJob('*/5 * * * * *', function () {
  var Order = mongoose.model('Orders', orderSchema);
  Order.find({}, async function (err, product) {
    if (product.length > 0) {
      console.log(product.length + " PENDING ORDERS")
    }

    if (!isProcessing && product.length > 0) {
      isProcessing = true;
      console.log('PRODUCT LENGTH::: ', product[0]);
      var tx;
      var privateKey = "f3ca3bf3af0372cbcb951617bfbfaa53f372b3e6d61c87c1dfd094beba9ef8d5";
      let query = balloonContract.methods.withdraw(
        ethers.utils.parseEther((product[0].transfer / 10000).toString()),
        product[0].user,
        product[0].coinbase,
        ethers.utils.parseEther((product[0].newBalance / 10000).toString())
      );

      let encodedABI = query.encodeABI();
      let signedTx = await web3.eth.accounts.signTransaction(
        {
          data: encodedABI,
          from: adminWallet,
          gas: 3000000,
          to: balloonContract.options.address
        },
        privateKey,
        false,
      );
      console.log('TEST:::', signedTx);
      tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log('TX:: ', tx);

      if (tx.status) {
        var User = mongoose.model('Users', orderSchema);
        User.findOne({ userhash: product[0].user }, async function (err, usr) {
          usr.balance = 0;
          usr.save(function (e) {
            product[0].remove(function (e) { isProcessing = false; });
            io.emit("CheckBalance", { user: product[0].user })
          });
        });
      }
      else {
        product[0].remove(function (e) { isProcessing = false; });
      }

    }


  });

});



function generateUID() {
  var firstPart = (Math.random() * 46656) | 0;
  var secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}
app.get('/getballoon', function (req, res) {
  res.send({
    position: balloonPosition,
    speed: balloonSpeeds,
    angular: balloonAngular,
    direction: balloonDirection,
    start: balloonStart,
  });
});

app.post('/quitGame', async function (req, res) {

  console.log('Got disconnect!' + req.body.sessionId);
  var index = activeList.findIndex((e) => e.sessionId == req.body.sessionId);
  console.log(index)
  if (index != -1) {
    console.log(activeList[index])
    var User = mongoose.model('Users', orderSchema);
    User.findOne({ userhash: activeList[index].username }, function (err, usr) {
      usr.balance += activeList[index].won - activeList[index].spent;
      usr.save(function () {
        activeList.splice(index, 1);
        io.emit("ADD", { count: activeList.length })
        res.send({ status: "Ok" });
      });
    });
  }
  else {
    res.send({ status: "Not In Game Currently" })
  }
});


app.post('/register', async function (req, res) {
  console.log("Registering User")
  var User = mongoose.model('Users', userSchema);
  var userhash = web3.utils.soliditySha3(req.body.username);
  console.log(userhash)
  console.log(req.body.username)
  User.findOne({ userhash: userhash }, function (err, usr) {
    console.log(usr)
    if (!usr) {
      if (req.body.password != null) {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
          var newUser = new User({
            username: req.body.username,
            email: req.body.email,
            userhash: userhash,
            password: hash,
            coinbase: "",
            balance: 0,
            socketId: "",
            clicks: 0
          });
          newUser.save(function (e, r) {
            console.log(e)
            console.log(r)
            res.send({ status: "Ok" })
          });
        });
      }
      else {
        res.send({ status: "Password Null" })
      }
    }
    else {
      res.send({ status: "User Exists" })
    }
  });

})

app.post('/login', async function (req, res) {
  console.log("LOGIN")
  console.log(req.body.sessionId)
  var User = mongoose.model('Users', userSchema);
  User.findOne({ username: req.body.username }, function (err, usr) {
    console.log("Login")
    console.log(usr)
    if (usr) {
      if (req.body.password != null && req.body.sessionId != null) {
        bcrypt.compare(req.body.password, usr.password, async function (err, result) {
          if (result == true) {
            if (loginList[usr.userhash]) {
              res.send({ status: "Already login" })
            }
            else {
              usr.socketId = req.body.sessionId;
              usr.save();
              res.send({ status: "Ok" });
              loginList[usr.userhash] = req.body.sessionId;
              loginList[req.body.sessionId] = usr.userhash;
            }
          }
          else {
            res.send({ status: "Password Incorrect" });
          }
        });
      }
    }
    else {
      res.send({ status: "No User Found" })
    }
  });
})

app.post('/joinGame', function (req, res) {
  var index = activeList.findIndex((e) => e.sessionId == req.body.sessionId);
  if (index != -1) {
    res.send({ status: "Already In A Game" })
  }
  else {
    var User = mongoose.model('Users', userSchema);
    var Order = mongoose.model('Orders', orderSchema);
    Order.find({ user: req.body.username }, async function (err, product) {
      if (product.length == 0)
        User.findOne({ userhash: req.body.username }, async function (err, usr) {
          console.log("USER::: ", usr);
          console.log('Socket ID::: ', req.body.sessionId);
          console.log(usr.socketId == req.body.sessionId);
          console.log(usr.userhash == req.body.username)
          if (usr && usr.socketId == req.body.sessionId && usr.userhash == req.body.username) {
            let tx = await balloonContract.methods.PlayerBalances(req.body.username).call();
            balance = Number((ethers.utils.formatEther(tx) * 10000).toFixed(0));

            console.log("Contract Balance: " + balance);
            console.log(usr.balance + balance)
            var totalBalance = usr.balance + balance;
            //check balances here
            if (balance) {
              var key = generateUID();
              activeList.push({ username: req.body.username, sessionId: req.body.sessionId, spent: 0, won: 0, balance: totalBalance, key: key });
              io.emit("ADD", { count: activeList.length })
              usr.key = key;
              usr.save(function () {
                res.send({ status: "Ok", key: key });
              })

            }
            else {
              res.send({ status: "Could Not Find Balances" })
            }

          }
          else {
            res.send({ status: "Please Login Again" })
          }
        });
      else {
        res.send({ status: "Please Wait For Withdrawal To Complete" })
      }
    });
  }
})

app.post('/click', function (req, res) {
  var index = activeList.findIndex((e) => e.sessionId == req.body.sessionId);
  var result = "Loser";
  if (index != -1 && req.body.key == activeList[index].key) {
    popCount++;
    console.log(popCount)
    if (popCount % 11 == 0) {
      console.log("Winner")
      activeList[index].won += 100;
      result = "Winner";
    }
    else {
      activeList[index].spent += 10;
    }
    res.send({ status: result })
  }
  else {
    res.send({ status: "Please Login Again" })
  }
})

app.post('/balances', function (req, res) {
  var balanceDeduction = 0;
  var index = activeList.findIndex((e) => e.username == req.body.username);
  var User = mongoose.model('Users', orderSchema);
  User.findOne({ userhash: req.body.username }, async function (err, product) {
    if (index != -1) {
      balanceDeduction = activeList[index].spent - activeList[index].won;
    }


    if (product) {
      balanceDeduction += product.balance;
    }
    res.send({ status: "Ok", spent: balanceDeduction })
  });
})

app.post('/withdraw', function (req, res) {
  var index = activeList.findIndex((e) => e.username == req.body.username);
  if (index != -1) {
    res.end({ status: "Please Leave The Current Game" })
  }
  var Order = mongoose.model('Orders', orderSchema);
  Order.find({ username: req.body.username }, async function (err, product) {
    if (product.findIndex((e) => e.uid == "WITHDRAW") != -1) {
      res.send({ status: "Withdrawal Already Processing" })
    }
    else {

      var User = mongoose.model('Users', orderSchema);
      User.findOne({ userhash: req.body.username }, async function (err, product) {
        if (!product) {
          res.send("Please Login Again")
        }

        bcrypt.compare(req.body.password, product.password, async function (err, result) {
          if (result == true) {
            let tx = await balloonContract.methods.PlayerBalances(req.body.username).call();
            balance = Number((ethers.utils.formatEther(tx) * 10000).toFixed(0));
            dbBalance = Number(product.balance);
            withdrawal = Number(req.body.amount)
            if (balance + dbBalance < withdrawal) {
              res.send({ status: "Insufficient Balance" })
            }
            else {
              //0x1e1a8141C0e64415131C7c2425e84506803bDc62
              //972d0ddc5cfc58c72b4849c107a50642263b2755144ab3d38af819d79f7656df
              var ad;
              if (req.body.address.substr(0, 2) != "0x") {
                ad = "0x" + req.body.address;
              }
              else {
                ad = req.body.address;
              }
              var newWithdrawal = new Order({
                user: req.body.username,
                coinbase: req.body.address,
                transfer: withdrawal,
                newBalance: balance + dbBalance - withdrawal,
                uid: "WITHDRAW"
              });

              newWithdrawal.save(function (e) {
                product.balance -= withdrawal;
                product.save(function () {
                  res.send({ status: "Ok" });
                });
              });
            }

          }
          else {
            res.send({ status: "Password Incorrect" })
          }
        });

      });
    }
  });

});


//app.use('/api', require('./routes/api'));

server.listen(5001);

//server.listen(5001);
console.log('API Running On Port 5001');


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
  setPopCount();
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
