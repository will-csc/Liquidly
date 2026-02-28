# Services Structure (Auxiliary Microservices)

This document explains the organization of auxiliary services in the `services` folder.

## `email-service` (Python Flask)
This is an isolated microservice responsible solely for sending emails.

### Main Files:
- **`app.py`**:
    - **What it is:** The main Python server code.
    - **Importance:** Starts a web server (Flask) that listens for requests on the `/send-email` route. When it receives a request, it connects to the SMTP server (Gmail, AWS SES) and sends the email.
- **`requirements.txt`**:
    - **What it is:** List of dependencies.
    - **Importance:** Tells Python which libraries to install (`Flask`, `python-dotenv`) for the code to work.
- **`.env`**:
    - **What it is:** Environment variables.
    - **Importance:** Stores passwords and sensitive configuration (email, app password) that should not be written directly in the code for security.
