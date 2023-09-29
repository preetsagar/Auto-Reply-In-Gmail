# Auto Reply Gmail App

## Overview
This Node.js application automates vacation auto-replies for Gmail using the Gmail API. It utilizes OAuth2 for authentication and can be configured to run as a standalone script.

## Prerequisites
- Node.js installed on your machine
- Gmail API credentials (Client ID, Client Secret, Redirect URI)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [googleapis](https://www.npmjs.com/package/googleapis)
- [readline-sync](https://www.npmjs.com/package/readline-sync)

## Installation
1. Clone the repository to your local machine.
2. Install the required dependencies using npm:

### npm install
- 3. Create a `.env` file in the root directory and populate it with your Gmail API credentials:
- CLIENT_ID=YOUR_CLIENT_ID
- CLIENT_SECRET=YOUR_CLIENT_SECRET
- REDIRECT_URI=YOUR_REDIRECT_URI

## Usage
1. Run the application using the command:
2. node index.js
3. Follow the prompts to authorize the application and provide the authorization code.

## Configuration
- Modify the `scope` in `generateAuthUrl` to specify the desired access level.

## Notes
- The application checks for unread emails and sends an auto-reply to each unique sender.
- If the sender has been previously replied to, it skips sending another auto-reply.
- A label "Vacation_auto_reply" is created (if not already present) and applied to the email.


