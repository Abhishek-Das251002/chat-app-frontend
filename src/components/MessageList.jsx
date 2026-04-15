import React, { useState } from "react";
import { MdCheck } from "react-icons/md";
import { MdDoneAll } from "react-icons/md";

const formatTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const today = new Date();
  today.setDate(today.getDate() - 1);

const yesterday = today.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).replace(/\//g, '-')


const MessageList = ({ messages, user}) => {
  let myMessages = []

  for(let i=0; i < messages.length ; i++){
    if(i !== 0 && new Date(messages[i].createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') === new Date(messages[i-1].createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')){
      let currentMsg = 
            <div
              key={i}
              className={`message ${
                messages[i].sender === user.username ? "sent" : "received"
              }`}
            >
              <strong>{messages[i].sender}: </strong>
              {messages[i].message}<br/>
              <span className="text-secondary" style={{fontSize: "0.8rem"}}>{formatTime(messages[i].createdAt)}</span>
              {messages[i].sender === user.username && messages[i].status === "sent"
              ?
              <span><MdCheck/></span>
              :
              messages[i].sender === user.username && messages[i].status === "delivered"
              ?
              <span><MdDoneAll/></span>
              :
              messages[i].sender === user.username && messages[i].status === "seen"
              ?
              <span><MdDoneAll style={{color: "blue"}}/></span>
              :
              <span></span>
              }
            </div>
      myMessages = [...myMessages, currentMsg]
    }else{
      let currentMsg = 
      <div>
        <div className="text-center text-secondary">
          {new Date(messages[i].createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') === new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
          ?
          "Today"
          :
          new Date(messages[i].createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') === yesterday
          ?
          "Yesterday"
          :
          new Date(messages[i].createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')
          }
        </div>
        <div
          key={i}
          className={`message ${
            messages[i].sender === user.username ? "sent" : "received"
          }`}
        >
          <strong>{messages[i].sender}: </strong>
          {messages[i].message}<br/>
          <span className="text-secondary" style={{fontSize: "0.8rem"}}>{formatTime(messages[i].createdAt)}</span>
          {messages[i].sender === user.username && messages[i].status === "sent"
          ?
          <span><MdCheck/></span>
          :
          messages[i].sender === user.username && messages[i].status === "delivered"
          ?
          <span><MdDoneAll/></span>
          :
          messages[i].sender === user.username && messages[i].status === "seen"
          ?
          <span><MdDoneAll style={{color: "blue"}}/></span>
          :
          <span></span>
          }
        </div>
    </div>

    myMessages = [...myMessages, currentMsg]
    }
}

  return (
      <div className="message-list">
        {myMessages}
      </div>
    )

};

export default MessageList;
