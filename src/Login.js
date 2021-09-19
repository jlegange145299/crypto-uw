import React, { Component } from 'react';
import { positions, withAlert } from 'react-alert'
import './App.css';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      email: "",
      isLogin: false,
      isRegister: false,
      agree: false,
    };
    this.handleUsername = this.handleUsername.bind(this);
    this.handlePassword = this.handlePassword.bind(this);
    this.handleEmail = this.handleEmail.bind(this);
    this.handleAgree = this.handleAgree.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleBack = this.handleBack.bind(this);
    //this.create = this.create.bind(this);
  }

  handleUsername(event) {
    this.setState({ username: event.target.value })
  }

  handleAgree(event){
    console.log(event.target.value);
    this.setState({ agree: event.target.value === 'on' })
  }

  handlePassword(event) {
    this.setState({ password: event.target.value })
  }

  handleEmail(event) {
    this.setState({ email: event.target.value })
  }

  handleLogin() {
    if (this.state.isLogin) {
      if(this.state.username == "")
      {
        this.props.alert.error("Input username");
        return;
      }
      this.props.login(this.state.username, this.state.password);
    }
    else {
      this.setState({ isLogin: true });
    }
  }

  handleBack() {
    this.setState({ isLogin: false, isRegister: false });
  }

  handleRegister() {
    if (this.state.isRegister) {
      if(this.state.username == "")
      {
        this.props.alert.error("Input username");
        return;
      }
      this.props.register(this.state.username, this.state.email, this.state.password);
    }
    else {
      this.setState({ isRegister: true });
    }
  }


  render() {
    return (
      <div className="Login">
        { (this.state.isLogin || this.state.isRegister) &&
          <>
            <p>Username</p>
            <input value={this.state.username} onChange={this.handleUsername} />
            <br />
            {this.state.isRegister && (
              <>
                <p>Email</p>
                <input value={this.state.email} onChange={this.handleEmail} />
                <br />
              </>)
            }
            <p>Password</p>
            <input type="password" value={this.state.password} onChange={this.handlePassword} />
            <br/><br/>
            {this.state.isRegister && (
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                  <input type="checkbox" style={{height: '17px', width: '17px'}} value={this.state.agree} onChange={this.handleAgree}/>
                  <p style={{marginTop: '6px'}}>You should agree with <a target="_blank" style={{fontSize: '12px'}} href="/privacy">Privacy Policy </a>&nbsp;&nbsp;and&nbsp;&nbsp;<a target="_blank"  style={{fontSize: '12px'}} href="/terms">Terms  and  Services</a></p>
                  <br />
                </div>)
            }
            <br /><br />
          </>
        }
        { (this.state.isRegister || this.state.isLogin) &&
          <>
            <button className="midnight-blue-flat-button" onClick={this.handleBack}>BACK</button>
            <div className="divider" />
          </>
        }
        { !this.state.isRegister &&
          <>
            <button className="midnight-blue-flat-button" onClick={this.handleLogin}>LOGIN</button>
            <div className="divider" />
          </>
        }
        { !this.state.isLogin &&
          <button className="midnight-blue-flat-button" onClick={this.handleRegister}>REGISTER</button>
        }
      </div>
    );
  }
}

export default withAlert()(Login);
