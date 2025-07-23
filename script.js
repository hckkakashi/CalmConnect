import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV1TTLe_yEKwARt5GiizxFffm0dblv68I",
  authDomain: "mentalhealthchat-4fe3d.firebaseapp.com",
  databaseURL: "https://mentalhealthchat-4fe3d-default-rtdb.firebaseio.com",
  projectId: "mentalhealthchat-4fe3d",
  storageBucket: "mentalhealthchat-4fe3d.firebasestorage.app",
  messagingSenderId: "592240379941",
  appId: "1:592240379941:web:9aca2970d03b09b4bd57cc",
  measurementId: "G-9EHZF5K3KJ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const GEMINI_API_KEY = "AIzaSyBSXzOaGJFn9hez2ecDVM-s_HsXtglQ_Ug";

function toggleChatbot() {
  const popup = document.getElementById("chatbot-popup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

function appendMessage(sender, text, containerId = "chat-box") {
  const chatBox = document.getElementById(containerId);
  const msg = document.createElement("div");
  msg.textContent = `${sender === "user" ? "You" : "Bot"}: ${text}`;
  msg.style.margin = "6px 0";
  msg.style.color = sender === "user" ? "#1976d2" : "#2e7d32";
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const userText = input.value.trim();
  if (!userText) return;
  appendMessage("user", userText);
  input.value = "";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a supportive mental health assistant. Be empathetic and never give medical advice. Here's the user message: ${userText}`
                }
              ]
            }
          ]
        })
      }
    );
    const data = await response.json();
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to support you.";
    appendMessage("bot", botReply);
  } catch (error) {
    appendMessage("bot", "Sorry, something went wrong. Please try again later.");
    console.error("Gemini API error:", error);
  }
}

const badWords = ["badword1", "badword2", "Shit", "damn"]; 
function containsBadWords(text) {
  const lower = text.toLowerCase();
  return badWords.some(word => lower.includes(word));
}

function sendCommunityMessage() {
  const input = document.getElementById("community-input");
  const text = input.value.trim();
  if (!text) return;

  if (containsBadWords(text)) {
    alert("Please avoid inappropriate language.");
    return;
  }

  push(ref(db, "messages"), {
    text,
    time: Date.now(),
    user: "Anonymous"
  });

  input.value = "";
}

onValue(ref(db, "messages"), (snapshot) => {
  const chatBox = document.getElementById("chat-messages");
  chatBox.innerHTML = "";
  snapshot.forEach(child => {
    const msg = child.val();
    const time = new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const div = document.createElement("div");
    div.textContent = `${msg.user} (${time}): ${msg.text}`;
    div.style.marginBottom = "5px";
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

function submitStory() {
  const storyInput = document.getElementById("story-input");
  const story = storyInput.value.trim();
  const confirmDiv = document.getElementById("story-confirm");
  if (!story) {
    confirmDiv.textContent = "Please enter a story before submitting.";
    return;
  }
  if (containsBadWords(story)) {
    confirmDiv.textContent = "Please avoid inappropriate language in your story.";
    return;
  }

  push(ref(db, "stories"), {
    text: story,
    time: Date.now(),
    user: "Anonymous"
  });
  confirmDiv.textContent = "Thank you for sharing your story anonymously.";
  storyInput.value = "";

  setTimeout(() => (confirmDiv.textContent = ""), 5000);
}

window.sendMessage = sendMessage;
window.sendCommunityMessage = sendCommunityMessage;
window.toggleChatbot = toggleChatbot;
window.submitStory = submitStory;
