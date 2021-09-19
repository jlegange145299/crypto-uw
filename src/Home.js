import React, { Component } from 'react';
import { positions, withAlert } from 'react-alert'
import GameScreen from './GameScreen';
import Login from './Login';
import Profile from './Profile';
import TopUp from './TopUp';
import CashOut from './CashOut';
import Chat from './Chat'
import './App.css';
import getWeb3 from './getWeb3';
import { ethers } from 'ethers';
import openSocket from 'socket.io-client';
import getRandomInt from './utils';
import { getTimeString } from './utils';
import serverURL from './constansts';
import Web3 from 'web3'
const socket = openSocket(serverURL);//, {transports: ['websocket', 'polling'], secure: false});


const abi = [{"constant":false,"inputs":[{"name":"amount","type":"uint256"},{"name":"user","type":"bytes32"},{"name":"userAddress","type":"address"},{"name":"newBalance","type":"uint256"}],"name":"withdraw","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"PlayerBalances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"sender","type":"address"}],"name":"changeAdmin","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"user","type":"bytes32"}],"name":"deposit","outputs":[{"name":"success","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":true,"stateMutability":"payable","type":"constructor"}];

const colors = ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#ffadad', '#57cc99', '#80ed99', '#ff0a54', '#ff477e', '#ff5c8a', '#004b23', '#006400', '#007200', '#38b000', '#ff7b00', '#ff9500', '#ffb700'];

const contractAddress = "0xE537F53D5C045Eae39cf4Ca308605b26eB5e85E1";

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      currentUser: "",
      username: "",
      password: "",
      sessionId: "",
      coinbase: "",
      privateKey: "",
      key: null,
      userCount: 0,
      balance: 0,
      spent: 0,
      gameStarted: false,
      forcePop: false,
      currentPanel: 0,
      amount: 0,
      messageList: [{ sender: "GM", message: "Welcome to CryptoPop!", date: new Date().getUTCMilliseconds(), timestring: getTimeString(new Date()) }],
      chatMessage: "",
      colorIndex: 0,
      boomMsgList: [ ],
      isProcessing: false
    }

    this.login = this.login.bind(this)
    this.logOut = this.logOut.bind(this)
    this.register = this.register.bind(this)
    this.getBalance = this.getBalance.bind(this)
    this.handlePanels = this.handlePanels.bind(this)
    this.handleKey = this.handleKey.bind(this)
    this.handleAmount = this.handleAmount.bind(this)
    this.handleAddress = this.handleAddress.bind(this)
    this.handleMessageBox = this.handleMessageBox.bind(this)
    this.joinGame = this.joinGame.bind(this)
    this.quitGame = this.quitGame.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.topUp = this.topUp.bind(this)
    this.cashOut = this.cashOut.bind(this)
    this.clickBalloon = this.clickBalloon.bind(this)
  }

  componentDidMount() {
    var that = this;

    socket.on('connect', function () {
      console.log("connected")
      that.setState({ sessionId: socket.id })
    });
    socket.on("ADD", message => {
      console.log(message);
      that.setState({ userCount: message.count });
    });
    socket.on("POP", message => {
      console.log(message);
      that.setState({ forcePop: true });
    });
    socket.on("CheckBalance", message => {
      console.log(message);
      that.getBalance();
    });
    socket.on("CHAT", message => {
      if (message.message === "I won.") {
        //if(message.sender !== this.state.username)
        {
          /* this.props.alert.success(<div style={{ fontSize: '1.5em', wordBreak: 'break-all' }}>{message.sender} won +100.</div>, {
            position: positions.MIDDLE
          }); */
          var boomMsg = "";
          if(message.sender !== this.state.username)
            boomMsg = message.sender + ": Just won +100";
          else
            boomMsg = "You just won +100";
          var that = this;
          var boomMsgList = this.state.boomMsgList;
          boomMsgList.push(boomMsg);
          this.setState({ boomMsgList: boomMsgList });
          console.log(this.state.boomMsgList);
          setTimeout(function () {
            var boomMsgList1 = that.state.boomMsgList;
            boomMsgList1.pop();
            that.setState({ boomMsgList: boomMsgList1 });
          }, 5000);
        }
        message.message = 'I just won +100.';
      }

      var msg = this.state.messageList;

      var date = new Date(message.date);

      if (msg.length == 1) {
        var t_msg = { sender: 'date-separator', date: message.date, message: date.toLocaleDateString() };
        msg.push(t_msg);
      }
      else {
        var predate = new Date(msg[msg.length - 1].date);
        if (date.toLocaleDateString() != predate.toLocaleDateString()) {
          var t_msg = { sender: 'date-separator', date: message.date, message: date.toLocaleDateString() };
          msg.push(t_msg);
        }
      }

      msg.push({ sender: message.sender, message: message.message, color: message.color, date: message.date, timestring: getTimeString(date) });
      this.setState({ messageList: msg });
    });
    socket.on("HISTORY", messages => {
      var msg = that.state.messageList;
      if (msg.length > 1)
        return;
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        var date = new Date(message.date);
        if (i == 0) {
          var t_msg = { sender: 'date-separator', date: message.date, message: date.toLocaleDateString() };
          msg.push(t_msg);
        }
        else {
          var predate = new Date(messages[i - 1].date);
          if (date.toLocaleDateString() != predate.toLocaleDateString()) {
            var t_msg = { sender: 'date-separator', date: message.date, message: date.toLocaleDateString() };
            msg.push(t_msg);
          }
        }
        if (message.message === 'I won.') {
          message.message = 'I just won +100.';
        }
        if (message.message !== "I won.") {
          msg.push({ sender: message.sender, message: message.message, color: message.color, date: message.date, timestring: getTimeString(date) });
        }
      }
      that.setState({ messageList: msg });
    });

    getWeb3.then(results => {
      this.setState({ web3: results.web3 })
      var that = this;
      results.web3.eth.getAccounts((error, accounts) => {
        if (accounts && accounts.length != 0) {
          this.setState({ coinbase: accounts[0] })
        }
        if (localStorage.getItem('defaultWallet') && localStorage.getItem('defaultWallet').length > 30) {
          var cb = localStorage.getItem('defaultWallet');
          var k = localStorage.getItem('defaultKey')
          if (k.length > 32) {
            k = k.substr(2, k.length - 1)
          }
          this.setState({ coinbase: cb, pKey: k });
          let x = results.web3.eth.accounts.privateKeyToAccount(localStorage.getItem('defaultKey'));
          //console.log(results.web3.eth.accounts.wallet.add(x));
          console.log(x)
          console.log(results.web3.eth.accounts.wallet)
        }
      }).catch(() => { console.log('Error finding web3.') });
    });

    this.setState({ colorIndex: getRandomInt(0, colors.length) });
  }

  register(username, email, password) {
    console.log("Registering...")
    fetch(serverURL + 'register/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "username": username,
          "email": email,
          "password": password
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          this.props.alert.show(data.status)
        }
        else {
          this.login(username, password);
        }
      }).catch(function (err) {
        console.log(err)
      });
  }

  login(username, password) {
    fetch(serverURL + 'login/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        //mode: "no-cors",
        body: JSON.stringify({
          "username": username,
          "password": password,
          "sessionId": this.state.sessionId
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          this.props.alert.show(data.status)
        }
        else {
          var userhash = this.state.web3.utils.soliditySha3(username);
          this.setState({ currentUser: userhash, username: username, password: password }, function () {
            this.getBalance();
          });
        }
      }).catch(function (err) {
        console.log(err)
      });
  }

  logOut() {
    document.location.reload();
  }

  async getBalance() {
    let contract = new this.state.web3.eth.Contract(abi, contractAddress);
    let currentValue = await contract.methods.PlayerBalances(this.state.currentUser).call();
    console.log('Current Value::: ', currentValue);
    console.log(ethers.utils.formatEther(currentValue) * 10000)
    this.setState({ balance: Number((ethers.utils.formatEther(currentValue) * 10000).toFixed(0)) })

    fetch(serverURL + 'balances/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "username": this.state.currentUser,
          "sessionId": this.state.sessionId
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          console.log(data.status)
        }
        else {
          console.log(data.spent)
          this.setState({ spent: Number(data.spent) });
        }
      }).catch(function (err) {
        console.log(err)
      });

  }

  clickBalloon(idx,score) {
    socket.emit("POP",idx);
    if(!this.state.gameStarted)
      return;
    console.log("CLICKED")
    fetch(serverURL + 'click/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "username": this.state.currentUser,
          "key": this.state.key,
          "sessionId": this.state.sessionId
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status == "Winner") {
          /* this.props.alert.success(<div style={{ fontSize: '2em' }}>+100</div>, {
            position: positions.BOTTOM_CENTER
          }); */
          this.setState({ spent: this.state.spent + 100 });
          socket.emit("CHAT", { sender: this.state.username, message: "I won.", color: this.state.colorIndex });
        }
        else if (data.status == "Loser") {
          score.setText("-10");
          /* this.props.alert.show("-10", {
            position: positions.BOTTOM_RIGHT
          }); */
          this.setState({ spent: this.state.spent - 10 });
        }
        else {
          this.props.alert.show(data.status)
        }
      }).catch(function (err) {
        console.log(err)
      });
  }

  joinGame() {
    fetch(serverURL + 'joinGame/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "username": this.state.currentUser,
          "key": this.state.key,
          "sessionId": this.state.sessionId

        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          this.props.alert.show(data.status)
        }
        else {
          this.setState({ key: data.key, gameStarted: true });
        }
      }).catch(function (err) {
        console.log(err)
      });
  }

  async topUp() {
    //if(key.substr(0,2) != "0x")
    //key = "0x" + this.state.privateKey;
    if(!window.BinanceChain)
    {
      this.props.alert.show("Please install Binance Chain Wallet.");
      return;
    }
    let mainContract = new this.state.web3.eth.Contract(abi, contractAddress);
    let account = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
    let chainId = await window.BinanceChain.request({ method: 'eth_chainId' });
    if (chainId != 97) {
      this.props.alert.error("Wrong network");
      return;
    }
    let amount = ethers.utils.parseEther(this.state.amount).toString();
    let overrides = {
      gasLimit: 53000,
      from: account[0],
      value: amount
    };
    console.log(overrides);
    let thisObj = this;
    mainContract.methods.deposit(this.state.currentUser).send(overrides).on('transactionHash', function () {
      thisObj.props.alert.show("Please Await Transaction")
      thisObj.setState({ currentPanel: 0 })
    })
      .on('receipt', (res) => {
        thisObj.props.alert.show("Deposit Confirmed")
        thisObj.getBalance()
      });
    return;
  }

  cashOut() {
    if(this.state.isProcessing)
    {
      this.props.alert.error("You can't withdraw at the moment.");
      return;
    }
    if(this.state.amount > this.state.balance)
    {
      this.props.alert.error("Please input correct amount.");
      return;
    }
    this.setState({ isProcessing: true });
    fetch(serverURL + 'withdraw/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "key": this.state.key,
          "username": this.state.currentUser,
          "password": this.state.password,
          "address": this.state.coinbase,
          "sessionId": this.state.sessionId,
          "amount": this.state.amount
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          this.props.alert.show(data.status);
        }
        else {
          this.props.alert.show("Withdrawal confirmed");
          this.setState({ currentPanel: 0 });
          this.getBalance();
        }
        this.setState({ isProcessing: false });
      }).catch(function (err) {
        this.setState({ isProcessing: true });
        console.log(err)
      });
  }

  quitGame() {
    fetch(serverURL + 'quitGame/',
      {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "username": this.state.currentUser,
          "key": this.state.key,
          "sessionId": this.state.sessionId
        })
      }).then(response => response.json())
      .then(data => {
        if (data.status != "Ok") {
          this.props.alert.show(data.status)
        }
        else {
          this.setState({ gameStarted: false });
          this.getBalance();
        }
      }).catch(function (err) {
        console.log(err)
      });
  }

  sendMessage() {
    var sender = (this.state.username == "" ? "Guest" : this.state.username);
    socket.emit("CHAT", { sender: sender, message: this.state.chatMessage, color: this.state.colorIndex })
    this.setState({ chatMessage: "" })
  }

  handleMessageBox(event) {
    this.setState({ chatMessage: event.target.value })
  }

  handlePanels(val) {
    this.setState({ currentPanel: val })
  }

  handleKey(event) {
    this.setState({ privateKey: event.target.value })
  }

  handleAmount(event) {
    this.setState({ amount: event.target.value })
  }

  handleAddress(event) {
    this.setState({ coinbase: event.target.value })
  }

  render() {
    const profilePanels = [
      <Profile
        joinGame={this.joinGame}
        logOut={this.logOut}
        username={this.state.username}
        balance={this.state.balance + this.state.spent}
        handlePanels={this.handlePanels}
      />,
      <TopUp
        joinGame={this.joinGame}
        username={this.state.username}
        balance={this.state.balance + this.state.spent}
        handlePanels={this.handlePanels}
        handleAmount={this.handleAmount}
        amount={this.state.amount}
        privateKey={this.state.privateKey}
        handleKey={this.handleKey}
        topUp={this.topUp}
      />,
      <CashOut
        joinGame={this.joinGame}
        username={this.state.username}
        balance={this.state.balance + this.state.spent}
        handlePanels={this.handlePanels}
        coinbase={this.state.coinbase}
        handleAmount={this.handleAmount}
        handleAddress={this.handleAddress}
        amount={this.state.amount}
        cashOut={this.cashOut}
      />
    ]
    return (
      <div className="Home">
        {this.state.boomMsgList.length > 0 &&
          <div className='boom-message-list'>
            <div>
              <div>
                {this.state.boomMsgList.map((boomMsg) => {
                  return (
                    <div>
                      <div className='boom-message' style={{ backgroundImage: 'url(/images/boom.png)' }}>
                        {boomMsg}
                      </div>
                    </div>);
                })
                }
              </div>
            </div>
          </div>
        }
        <div className="Panel">
          <h1>CryptoPop</h1>
          {this.state.currentUser == "" ? <Login login={this.login} register={this.register} /> : (this.state.gameStarted ? null : profilePanels[this.state.currentPanel])}
        </div>
        {
          this.state.gameStarted &&
          <Chat messageList={this.state.messageList} chatMessage={this.state.chatMessage} handleChat={this.handleMessageBox} sendMessage={this.sendMessage} colors={colors} />
        }
        <GameScreen userCount={this.state.userCount} clickBalloon={this.clickBalloon} gameStarted={this.state.gameStarted} socket={socket}/>
        <div style={{ position: "absolute", left: "20px", top: "90px", backgroundColor: "#00000052", borderRadius: "5px", margin: "10px", color: "white", padding: "5px" }}>
          <h1>{this.state.userCount}</h1>
        Players</div>
        <div style={{ position: "absolute", right: "35px", top: "90px", backgroundColor: "#00000052", borderRadius: "5px", margin: "10px", color: "white", padding: "5px" }}>
          Balance
        <h1>{this.state.balance + this.state.spent}</h1></div>
        <div style={{ position: "absolute", right: "300px", top: "21px", borderRadius: "5px", margin: "10px", color: "white", padding: "5px" }}>
          <a className="changed-atag" target="_blank" href="/privacy"><h2>Privacy Policy</h2></a></div>
        <div style={{ position: "absolute", right: "30px", top: "21px", borderRadius: "5px", margin: "10px", color: "white", padding: "5px" }}>
          <a  className="changed-atag" target="_blank" href="/terms"><h2>Terms and Services</h2></a></div>
        {this.state.gameStarted ?
          <div onClick={this.quitGame} className="quitButton" style={{ position: "absolute", right: "0px", bottom: "0px", backgroundColor: "#00000052", borderRadius: "5px", margin: "10px", color: "white", padding: "5px" }}>
            Quit Game</div>
          : null}
      </div>
    );
  }
}

export default withAlert()(Home);
