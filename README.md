# Chat App with Busy Status and AI Response

This is a real-time chat application built with Node.js, Express, Socket.io, and MongoDB. The app features a busy status for users and integrates Google's Gemini Pro model to generate automated responses when a user is busy.

## ✨ Features
- User authentication (sign up and sign in)
- Real-time messaging with Socket.io
- User status (AVAILABLE, BUSY, ONLINE)
- Automated AI response generation with Google Gemini Pro for busy users
- Persistent message storage with MongoDB

## 🚀 Getting Started
### Prerequisites
- Node.js and npm (or yarn)
- MongoDB instance

### Installation
1. Clone the repository
```bash
https://github.com/shivanshu877/Real-Time-Chat-App-Backend.git  
```
3. Install dependencies:
```bash
   npm install  
```
4. Set up environment variables:
```json
{
"JWT_SECRET":
"GEMINI_API_KEY":
}
```
4. Start the server:
 ```bash
 npm start 
 ```
## 💻 Frontend Usage
Go to the frontend directory and run `chat_app.exe`.
## 💻 Backend Usage
1. Access the application in your browser (e.g., http://localhost:3000).
2. Sign up for a new account or sign in to an existing one.
3. View the list of available users and start chatting!
4. Change your status to BUSY to enable AI responses.

Get Api Collection:    
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/20448680-2547960e-a241-4c06-bc7b-21f7f7fdf974?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D20448680-2547960e-a241-4c06-bc7b-21f7f7fdf974%26entityType%3Dcollection%26workspaceId%3D5dd9b309-6042-4f8f-ba66-67f1a423925d)

## 📡 API Endpoints
| Endpoint              | Method | Description                                   |
|-----------------------|--------|-----------------------------------------------|
| /users                | GET    | Get a list of all users (excluding the logged-in user) |
| /user/update/status  | PATCH  | Update the current user's status (AVAILABLE or BUSY)   |
| /signup               | POST   | Create a new user account                     |
| /signin               | POST   | Sign in to an existing user account           |

## 🔌 Socket.io Events
| Event               | Description                                        |
|---------------------|----------------------------------------------------|
| userLoggedIn        | Emitted when a user logs in.                       |
| sendMessage         | Sends a message to a specific recipient.           |
| getMessages         | Retrieves messages between two users.              |
| userStatusUpdate    | Updates the current user's status.                |
| incomingMessage     | Received when a new message arrives.              |
| userStatusUpdated   | Received when a user's status changes.            |

## 🧠 AI Integration
- When a user's status is BUSY, incoming messages are sent to Google's Gemini Pro model as a prompt.
- The model generates a response based on the provided message and the user's busy status context.
- The generated AI response is then sent back to the sender.

## 🗃️ Data Model
### User
| Field      | Type    | Description                              |
|------------|---------|------------------------------------------|
| email      | String  | Unique email address of the user.        |
| password   | String  | Hashed password for authentication.      |
| username   | String  | Display name of the user.                |
| status     | String  | Current status of the user (AVAILABLE, BUSY, ONLINE). |
| prevstatus | String  | Previous status of the user.             |

### Message
| Field      | Type    | Description                              |
|------------|---------|------------------------------------------|
| sender     | ObjectId| User ID of the sender.                   |
| recipient  | ObjectId| User ID of the recipient.                |
| content    | String  | Message text.                            |
| timestamp  | Date    | Time of message creation.                |
