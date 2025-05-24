'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');

let stompClient = null;
let nickname = null;
let fullname = null;
let selectedUserId = null;

function connect(event) {
    nickname = document.querySelector('#nickname').value.trim();
    fullname = document.querySelector('#fullname').value.trim();

    if (nickname && fullname) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

async function onConnected() {
    stompClient.subscribe(`/user/${nickname}/queue/messages`, onMessageReceived);

    // Register the connected user as ONLINE
    stompClient.send("/app/user.addUser",
        {},
        JSON.stringify({ nickName: nickname, fullName: fullname, status: 'ONLINE' })
    );

    document.querySelector('#connected-user-fullname').textContent = fullname;

    // ✅ Fetch all users this user has chatted with earlier
    try {
        const response = await fetch(`/chat-users/${nickname}`);
        if (response.ok) {
            const chatUsers = await response.json();
            const connectedUsersList = document.getElementById('connectedUsers');
            connectedUsersList.innerHTML = ''; // clear old users
            chatUsers.forEach(user => appendUserElement(user, connectedUsersList));
        }
    } catch (err) {
        console.error("Error fetching chat users:", err);
    }
}


// async function findAndDisplayConnectedUsers() {
//     const connectedUsersResponse = await fetch('/users');
//     let connectedUsers = await connectedUsersResponse.json();
//     connectedUsers = connectedUsers.filter(user => user.nickName !== nickname);
//     const connectedUsersList = document.getElementById('connectedUsers');
//     connectedUsersList.innerHTML = '';

//     connectedUsers.forEach(user => {
//         appendUserElement(user, connectedUsersList);
//         if (connectedUsers.indexOf(user) < connectedUsers.length - 1) {
//             const separator = document.createElement('li');
//             separator.classList.add('separator');
//             connectedUsersList.appendChild(separator);
//         }
//     });
// }

function appendUserElement(user, connectedUsersList) {
    const listItem = document.createElement('li');
    listItem.classList.add('user-item');
    listItem.id = user.nickName;

    const userImage = document.createElement('img');
    userImage.src = 'https://cdn2.momjunction.com/wp-content/uploads/2019/07/Whatsapp-DP-Images-For-Boys-1.jpg.webp';
    userImage.alt = user.fullName;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.fullName;

    const receivedMsgs = document.createElement('span');
    receivedMsgs.textContent = '0';
    receivedMsgs.classList.add('nbr-msg', 'hidden');

    listItem.appendChild(userImage);
    listItem.appendChild(usernameSpan);
    listItem.appendChild(receivedMsgs);

    listItem.addEventListener('click', userItemClick);

    connectedUsersList.appendChild(listItem);
}

async function userItemClick(event) {
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    messageForm.classList.remove('hidden');

    const clickedUser = event.currentTarget;
    clickedUser.classList.add('active');

    selectedUserId = clickedUser.getAttribute('id');

    // 1. Mark messages as seen in DB
    await fetch(`/messages/seen/${selectedUserId}/${nickname}`, { method: 'PUT' });

    // 2. Now fetch and display chat
    await fetchAndDisplayUserChat();

    // 3. Reset unread count in UI
    const nbrMsg = clickedUser.querySelector('.nbr-msg');
    nbrMsg.classList.add('hidden');
    nbrMsg.textContent = '0';
}



function displayMessage(senderId, content) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    if (senderId === nickname) {
        messageContainer.classList.add('sender');
    } else {
        messageContainer.classList.add('receiver');
    }
    const message = document.createElement('p');
    message.textContent = content;
    messageContainer.appendChild(message);
    chatArea.appendChild(messageContainer);
}

async function fetchAndDisplayUserChat() {
    console.log("************************************");
    console.log(selectedUserId);
    console.log("************************************");
    const userChatResponse = await fetch(`/messages/${nickname}/${selectedUserId}`);
    const userChat = await userChatResponse.json();
    chatArea.innerHTML = '';
    userChat.forEach(chat => {
        displayMessage(chat.senderId, chat.content);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
}


function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    const messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        const chatMessage = {
            senderId: nickname,
            recipientId: selectedUserId,
            content: messageInput.value.trim(),
            timestamp: new Date()
        };
        stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));
        displayMessage(nickname, messageInput.value.trim());
        messageInput.value = '';
    }
    chatArea.scrollTop = chatArea.scrollHeight;
    event.preventDefault();
}


async function onMessageReceived(payload) {
    console.log('Message received', payload);
    const message = JSON.parse(payload.body);

    // If the sender is not in the user list, fetch user details and add dynamically
    let senderUserElement = document.getElementById(message.senderId);
    if (!senderUserElement) {
        try {
            const response = await fetch(`/user/${message.senderId}`);
            if (response.ok) {
                const user = await response.json();
                const connectedUsersList = document.getElementById('connectedUsers');
                appendUserElement(user, connectedUsersList);
            }
        } catch (err) {
            console.error("Error fetching sender user info:", err);
        }
    }

    // If sender is selected, show message
    if (selectedUserId && selectedUserId === message.senderId) {
        displayMessage(message.senderId, message.content);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // If not selected, show message notification
    const notifiedUser = document.querySelector(`#${message.senderId}`);
    if (notifiedUser && !notifiedUser.classList.contains('active')) {
        const nbrMsg = notifiedUser.querySelector('.nbr-msg');
        nbrMsg.classList.remove('hidden');

        // Increment unread message count
        let currentCount = parseInt(nbrMsg.textContent || '0');
        nbrMsg.textContent = currentCount + 1;
    }
}


function onLogout() {
    stompClient.send("/app/user.disconnectUser",
        {},
        JSON.stringify({ nickName: nickname, fullName: fullname, status: 'OFFLINE' })
    );
    window.location.reload();
}


// Existing websocket logic here (if any)
// Modal logic
document.getElementById("openAddUserModal").addEventListener("click", function () {
    document.getElementById("addUserModal").classList.remove("hidden");
});

document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("addUserModal").classList.add("hidden");
});

document.getElementById("searchUserBtn").addEventListener("click", async function () {
    const searchNickname = document.getElementById("searchUserInput").value.trim();
    if (searchNickname === "") {
        alert("Please enter a nickname to search.");
        return;
    }

    if (searchNickname === nickname) {
        alert("You cannot chat with yourself.");
        return;
    }

    try {
        const response = await fetch(`/user/${searchNickname}`); // ✅ Call your backend API
        if (!response.ok) {
            alert("User not found.");
            return;
        }

        const user = await response.json();

        // Check if already in connected users list
        if (document.getElementById(user.nickName)) {
            alert("User is already in the list.");
            return;
        }

        const connectedUsersList = document.getElementById('connectedUsers');
        appendUserElement(user, connectedUsersList);

        // Close modal
        document.getElementById("addUserModal").classList.add("hidden");

    } catch (error) {
        console.error("Error searching user:", error);
        alert("An error occurred while searching for the user.");
    }
});




usernameForm.addEventListener('submit', connect, true); // step 1
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();