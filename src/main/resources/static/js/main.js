'use strict';

const registerPage = document.querySelector('#username-reg-page');
const registerForm = document.querySelector('#usernameRegForm');
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');

let stompClient = null;
let selectedUserId = null;
let user = null;
let userIdOrEmail = null;
let password = null;

document.getElementById('showLogin').onclick = () => {
    registerPage.classList.add('hidden');
    usernamePage.classList.remove('hidden');
};
document.getElementById('showRegister').onclick = () => {
    usernamePage.classList.add('hidden');
    registerPage.classList.remove('hidden');
};

function connect(event) {
    userIdOrEmail = document.querySelector('#userIdOrEmail').value.trim();
    password = document.querySelector('#password').value.trim();

    console.log(userIdOrEmail);
    console.log(password);

    if (userIdOrEmail && password) {
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, async () => {
            // ⬇️ Attempt login AFTER websocket connects
            const loginResponse = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userIdOrEmail: userIdOrEmail,
                    password: password
                })
            });

            if (loginResponse.ok) {
                user = await loginResponse.json();

                // ✅ Only show chat UI if login successful
                usernamePage.classList.add('hidden');
                chatPage.classList.remove('hidden');

                stompClient.subscribe(`/user/${user.userId}/queue/messages`, onMessageReceived);
                document.querySelector('#connected-user-fullname').textContent = `${user.fullName}(${user.userId})`;

                // ✅ Fetch chat users
                try {
                    const chatUsersResponse = await fetch(`/chat-users/${user.userId}`);
                    if (chatUsersResponse.ok) {
                        const chatUsers = await chatUsersResponse.json();
                        const connectedUsersList = document.getElementById('connectedUsers');
                        connectedUsersList.innerHTML = '';
                        chatUsers.forEach(connectedUser => appendUserElement(connectedUser, connectedUsersList));
                    }
                } catch (err) {
                    console.error("Error fetching chat users:", err);
                }

            } else {
                // ❌ Failed login — show alert and clear form
                alert("Invalid credentials. Please try again.");
                document.querySelector('#userIdOrEmail').value = '';
                document.querySelector('#password').value = '';
                stompClient.disconnect(() => console.log('WebSocket disconnected after failed login'));
            }
        }, onError);
    }

    event.preventDefault();
}

function appendUserElement(connectedUser, connectedUsersList) {
    const listItem = document.createElement('li');
    listItem.classList.add('user-item');
    listItem.id = connectedUser.userId;

    const userImage = document.createElement('img');
    userImage.src = 'https://cdn2.momjunction.com/wp-content/uploads/2019/07/Whatsapp-DP-Images-For-Boys-1.jpg.webp';
    userImage.alt = connectedUser.fullName;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = connectedUser.fullName;

    const receivedMsgs = document.createElement('span');
    // receivedMsgs.textContent = '0';
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
    await fetch(`/messages/seen/${selectedUserId}/${user.userId}`, { method: 'PUT' });

    // 2. Now fetch and display chat
    await fetchAndDisplayUserChat();

    // 3. Reset unread count in UI
    const nbrMsg = clickedUser.querySelector('.nbr-msg');
    nbrMsg.classList.add('hidden');
    // nbrMsg.textContent = '0';
}



function displayMessage(senderId, content) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    if (senderId === user.userId) {
        messageContainer.classList.add('sender');
    } else {
        messageContainer.classList.add('receiver');
    }
    const message = document.createElement('p');
    message.textContent = content;
    messageContainer.appendChild(message);
    chatArea.appendChild(messageContainer);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function fetchAndDisplayUserChat() {
    console.log("************************************");
    console.log(selectedUserId);
    console.log("************************************");
    const userChatResponse = await fetch(`/messages/${user.userId}/${selectedUserId}`);
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
            senderId: user.userId,
            recipientId: selectedUserId,
            content: messageInput.value.trim(),
            timestamp: new Date()
        };
        stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));
        displayMessage(user.userId, messageInput.value.trim());
        messageInput.value = '';
    }
    chatArea.scrollTop = chatArea.scrollHeight;
    event.preventDefault();
}


async function onMessageReceived(payload) {
    console.log('📩 Message received:', payload);
    const message = JSON.parse(payload.body);

    let senderUserElement = document.getElementById(message.senderId);

    if (!senderUserElement) {
        try {
            const response = await fetch(`/user/${message.senderId}`);
            if (response.ok) {
                const newUser = await response.json();
                const connectedUsersList = document.getElementById('connectedUsers');
                appendUserElement(newUser, connectedUsersList);
                senderUserElement = document.getElementById(newUser.userId); // update reference
            } else {
                console.error("❌ Failed to fetch user:", message.senderId);
                return;
            }
        } catch (err) {
            console.error("❌ Error fetching user details:", err);
            return;
        }
    }

    // Step 3: If sender is currently selected in chat, display the message directly
    if (selectedUserId && selectedUserId === message.senderId) {
        displayMessage(message.senderId, message.content);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Step 4: If not currently chatting with sender, show unseen message notification
    if (senderUserElement && !senderUserElement.classList.contains('active')) {
        const nbrMsg = senderUserElement.querySelector('.nbr-msg');
        if (nbrMsg) {
            nbrMsg.classList.remove('hidden');
            // let currentCount = parseInt(nbrMsg.textContent || '0');
            // nbrMsg.textContent = currentCount + 1;
        }
    }
}



function onLogout() {
    stompClient.send("/app/user.disconnectUser",
        {},
        JSON.stringify({ nickName: user.userId })
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
    const searchUserId = document.getElementById("searchUserInput").value.trim();
    if (searchUserId === "") {
        alert("Please enter userId to search.");
        return;
    }

    if (searchUserId === user.userId) {
        alert("You cannot chat with yourself.");
        return;
    }

    try {
        const response = await fetch(`/user/${searchUserId}`); // ✅ Call your backend API
        if (!response.ok) {
            alert("User not found.");
            return;
        }

        const searchedUser = await response.json();

        // Check if already in connected users list
        if (document.getElementById(searchedUser.userId)) {
            alert("User is already in the list.");
            return;
        }

        const connectedUsersList = document.getElementById('connectedUsers');
        appendUserElement(searchedUser, connectedUsersList);

        // Close modal
        document.getElementById("addUserModal").classList.add("hidden");

    } catch (error) {
        console.error("Error searching user:", error);
        alert("An error occurred while searching for the user.");
    }
});

const registerUser = async (event) => {
    event.preventDefault();

    const fullName = document.querySelector('#fullname').value.trim();
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#reg-password').value.trim();

    if (!fullName || !email || !password) {
        alert("Please fill all fields.");
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, password })
        });

        if (response.ok) {
            alert("Registration successful. You can now log in.");
            document.getElementById('showLogin').click(); // switch to login page
        } else {
            const errorText = await response.text();
            alert("Registration failed: " + errorText);
        }
    } catch (error) {
        console.error("Error during registration:", error);
        alert("Something went wrong. Please try again.");
    }
};

usernameForm.addEventListener('submit', connect, true); // step 1
registerForm.addEventListener('submit', registerUser, true)
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();