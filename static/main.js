function sendMessage() {
    let messageInput = document.getElementById('message-input');
    let message = messageInput.value.trim();

    // ✅ Validate input
    if (!validateMessage(message)) {
        displayMessage('system', '⚠️ Please enter a valid message before sending.');
        return;
    }

    displayMessage('user', message);
    
    let functionSelect = document.getElementById('function-select');
    let selectedFunction = functionSelect.value;
    
    let xhr = new XMLHttpRequest();
    let url;

    switch (selectedFunction) {
        case 'search':
            url = '/search';
            break;
        case 'kbanswer':
            url = '/kbanswer';
            break;
        case 'answer':
        default:
            url = '/answer';
    }
    
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Show loading indicator
    showLoadingIndicator();

    xhr.onload = function() {
        removeLoadingIndicator(); // Remove loading on response

        if (xhr.status === 200) {
            try {
                let response = JSON.parse(xhr.responseText);
                displayMessage('assistant', response.message);
            } catch (error) {
                displayMessage('assistant', '⚠️ Error processing response. Please try again.');
            }
        } else {
            displayMessage('assistant', `❌ Error: ${xhr.status} - Unable to fetch response.`);
        }

        scrollToBottom();
    };

    xhr.onerror = function() {
        removeLoadingIndicator();
        displayMessage('assistant', '🚨 Network error. Please check your connection.');
        scrollToBottom();
    };

    xhr.send(JSON.stringify({ message: message }));

    messageInput.value = ''; // Clear input field
}

// ✅ Function to validate user input
function validateMessage(message) {
    if (message.length === 0) return false; // Empty message
    if (/^[^a-zA-Z0-9]+$/.test(message)) return false; // Only special characters
    if (message.length > 500) {
        displayMessage('system', '⚠️ Message too long! Please limit to 500 characters.');
        return false;
    }
    return true;
}

// ✅ Function to show a loading indicator
function showLoadingIndicator() {
    let chatContainer = document.getElementById('chat-container');
    let loadingDiv = document.createElement('div');
    loadingDiv.classList.add('assistant-message', 'loading-message');
    loadingDiv.innerHTML = '<i>⏳ Thinking...</i>';
    loadingDiv.id = 'loading-message';
    chatContainer.appendChild(loadingDiv);
    scrollToBottom();
}

// ✅ Function to remove the loading indicator
function removeLoadingIndicator() {
    let loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// ✅ Function to display messages
function displayMessage(sender, message) {
    let chatContainer = document.getElementById('chat-container');
    let messageDiv = document.createElement('div');
    
    if (sender === 'assistant') {
        messageDiv.classList.add('assistant-message');
        let chatbotSpan = document.createElement('span');
        chatbotSpan.innerHTML = "<b>Superior AI:</b> ";
        messageDiv.appendChild(chatbotSpan);
        messageDiv.innerHTML += message;
    } else if (sender === 'system') {
        messageDiv.classList.add('system-message'); // Style for system messages
        messageDiv.innerHTML = message;
    } else {
        messageDiv.classList.add('user-message');
        let userSpan = document.createElement('span');
        userSpan.innerHTML = "<b>You:</b> ";
        messageDiv.appendChild(userSpan);
        messageDiv.innerHTML += message;
    }

    let timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.innerText = ` [${new Date().toLocaleTimeString()}]`;
    messageDiv.appendChild(timestamp);

    chatContainer.appendChild(messageDiv);

    scrollToBottom();
}

// ✅ Function to auto-scroll to the latest message
function scrollToBottom() {
    let chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight; 
}

// Handle button click event
document.getElementById('send-btn').addEventListener('click', sendMessage);

// Handle "Enter" key press
document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// Clear chat button functionality
document.getElementById('clear-btn').addEventListener('click', function() {
    document.getElementById('chat-container').innerHTML = ''; // Clears the chat
});
