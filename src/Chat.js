import React, { Component } from 'react';
import './App.css';


class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messagesEndRef: React.createRef()
    };
    this.scrollToBottom = this.scrollToBottom.bind(this);
  }
  componentDidMount (){
    this.scrollToBottom();
  }
  componentDidUpdate (){
    this.scrollToBottom();
  }
  scrollToBottom () {
    this.state.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
  render() {
    return (
      <div className="Chat" style={{position: "absolute", left: "0px", bottom: "0px", backgroundColor: "#00000052", width: "350px"}}>

        <div style={{height: "300px", textAlign: "left", overflow: "auto", overflowWrap: "break-word"}}>
          { this.props.messageList.map((o) => {
                if(o.sender == 'date-separator')
                  return (<div style={{ textAlign:'center' }}>----------{o.message}----------</div>)
                else
                  return(<div className='message-div' style={{ color: this.props.colors[o.color]}}>{o.sender}: {o.message} <div className='date'>{o.timestring}</div></div>)
              }
            )
          }
          <div ref={this.state.messagesEndRef} />
        </div>
        <input
        value={this.props.chatMessage}
        onChange={this.props.handleChat}
        onKeyPress ={(e) => {if(e.key === 'Enter') this.props.sendMessage()}}
        style={{position: "relative", bottom: "0px", width: "85%"}}/>

      </div>
    );
  }
}

export default Chat;
