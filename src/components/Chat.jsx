import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { HiOutlineFaceSmile } from "react-icons/hi2";
const socket = io("https://chat-app-backend-puhq.onrender.com");

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setTyping] = useState(false)
  const [typeMsg, setTypeMsg] = useState("")
  const [whoIsTyping, setWhoIsTyping] = useState("")
  const typeTimer = useRef(null)
  const currChatRef = useRef(currentChat)
  const [showEmoji, setShowEmoji] = useState(false)
  const [cursorIndex, setCursorIndex] = useState(0)
  const myInput = useRef(null);
  const emojiPicker = useRef(null)
  const emojiBtn = useRef(null)

  useEffect(() => {
    if(currentChat){
        const chatMessages = messages.filter(msg => msg.sender === currentChat && msg.receiver === user.username && msg.status !== "seen")
        if(chatMessages.length !== 0){
          const chatLastMsgId = chatMessages[chatMessages.length - 1]._id
          if(chatLastMsgId){
            socket.emit("message_seen", {sender: currentChat, receiver: user.username,lastMsgId: chatLastMsgId})
          }
        }        
      }
  },[currentChat, messages])

  useEffect(() => {
    socket.emit("newUser", user.username)
    
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("https://chat-app-backend-puhq.onrender.com/users", {
          params: { currentUser: user.username },
        });
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };

    fetchUsers();

    socket.on("receive_message", (data) => {
      if(user.username === data.receiver){
        socket.emit("message_delivered", data)
      }
      
      if ((data.sender === currChatRef.current && data.receiver === user.username) || (data.receiver === currChatRef.current && data.sender === user.username)) {
        setMessages((prev) => {
          const exists = prev.find(msg => msg.tempId === data.tempId);

          if (exists) {
            // replace temp message with DB message
            return prev.map(msg =>
              msg.tempId === data.tempId ? data : msg
            );
          }

          // for receiver side (no temp message)
          return [...prev, data];
        });
      }

      if(data.sender === currChatRef.current && data._id){
        socket.emit("message_seen", {
          sender: data.sender,
          receiver: data.receiver,
          lastMsgId: data._id
        })
      }
    });


    socket.on("typing", (data) => {
      if(data.receiver === user.username && data.sender === currChatRef.current){
        setTypeMsg("typing...")
        setWhoIsTyping(data.sender)
      }
    })

    socket.on("stop_typing", (data) => {
      if(data.receiver === user.username && data.sender === currChatRef.current){
        setTypeMsg("")
        setWhoIsTyping("")
      }
    })

    socket.on("message_delivered", (data) => {
      setMessages(prev =>
        prev.map(msg =>
          (msg._id === data._id || msg.tempId === data.tempId)
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    });

    socket.on("message_seen_update", (data) => {
      if (
        data.sender !== currChatRef.current &&
        data.receiver !== currChatRef.current
      ) return;

      setMessages(prev => prev.map(msg => 
          (msg.sender === data.sender && msg.receiver === data.receiver && msg._id && msg._id.toString() <= data.lastMsgId)
          ? {...msg, status: "seen"}
          : msg
        )
      )
    })

    function removeEmojiPicker(e){
      if(emojiPicker.current && !emojiPicker.current.contains(e.target) && !emojiBtn.current.contains(e.target)){
        setShowEmoji(false)
      }
    }

    document.addEventListener("click", removeEmojiPicker)

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("message_delivered");
      document.removeEventListener("click", removeEmojiPicker);
    }
  },[])

  useEffect(() => {
    if(typeTimer.current){
      clearTimeout(typeTimer.current)
    }

    if(currChatRef.current && isTyping){
      socket.emit("stop_typing", {sender: user.username, receiver: currChatRef.current} )
    }
    
    currChatRef.current = currentChat


    setTypeMsg("")
    setTyping(false)
    setWhoIsTyping("")
  }, [currentChat]);

  const fetchMessages = async (receiver) => {
    try {
      const { data } = await axios.get("https://chat-app-backend-puhq.onrender.com/messages", {
        params: { sender: user.username, receiver },
      });
      setMessages(data);
      setCurrentChat(receiver);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const sendMessage = () => {
    const messageData = {
      tempId: Date.now(),
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
      createdAt: Date.now(),
      status: "sent"
    };
    socket.emit("send_message", messageData);
    socket.emit("stop_typing", {sender: user.username, receiver: currentChat} )
    setTyping(false)
    setMessages((prev) => [...prev, messageData]);
    setCurrentMessage("");
  };

function insertEmoji(emoji) {
  const input = myInput.current;

  // get current cursor position directly from input
  const start = input.selectionStart;
  const end = input.selectionEnd;

  // insert emoji at cursor position
  const newMessage =
    currentMessage.slice(0, start) +
    emoji +
    currentMessage.slice(end);

  setCurrentMessage(newMessage);

  // calculate new cursor position
  const newCursorPos = start + emoji.length;

  // move cursor AFTER state update
  setTimeout(() => {
    input.focus();
    input.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
}


  function handleInput(e){
    setCurrentMessage(e.target.value)

    const chatAtStart = currChatRef.current

    if(currChatRef.current){
      const typeData = {
        sender: user.username,
        receiver: currChatRef.current,
      }

      if(!isTyping){
        socket.emit("typing", typeData)
        setTyping(true)
      }

      if(typeTimer.current){
        clearTimeout(typeTimer.current)  
      } 
      
      typeTimer.current = setTimeout(() => {
        if(currChatRef.current !== chatAtStart) return
        socket.emit("stop_typing", typeData)
        setTyping(false)
      }, 3000)
    } 
  }

  return (
    <div className="chat-container">
      {showEmoji
        &&
        <div className="emojiDiv d-flex justify-content-center">
          <div className="emojibox"  ref={emojiPicker}>
            <EmojiPicker onEmojiClick={(emojiObject) => insertEmoji(emojiObject.emoji)} />
          </div>
        </div>
      }
      <h2>Welcome, {user.username}</h2>
      <div className="chat-list">
        <h3>Chats</h3>
        {users.map((u) => (
          whoIsTyping === u.username
          ?
          <div
            key={u._id}
            className={`chat-user ${
              currentChat === u.username ? "active" : ""
            }`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}<br/>
            <span className="text-success">{typeMsg}</span>
          </div>
          :
          <div
            key={u._id}
            className={`chat-user ${
              currentChat === u.username ? "active" : ""
            }`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
          </div>
        ))}
      </div>
      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>
          <MessageList messages={messages} user={user}/>
          <div className="message-field">
            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              style={{ minWidth: "400px" }}
              onChange={handleInput}
              onSelect={(e) => setCursorIndex(e.target.selectionStart)}
              ref={myInput}
            />
            <HiOutlineFaceSmile ref={emojiBtn} size={50} style={{cursor: "pointer"}} onClick={() => setShowEmoji(!showEmoji)}/>
            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
