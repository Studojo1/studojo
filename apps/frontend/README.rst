Studojo Frontend
================

React Router frontend application for Studojo platform.

Overview
--------

The Studojo frontend is a modern, production-ready React application built with React Router v7, providing the user interface for the Studojo student productivity platform.

Features
--------

- Server-side rendering
- Hot Module Replacement (HMR)
- Asset bundling and optimization
- Data loading and mutations
- TypeScript by default
- TailwindCSS for styling
- Better Auth integration (JWT, phone OTP, Google OAuth, Passkeys)
- User onboarding flow
- Assignment generation interface
- Resume building and management (Careers Dojo)
- Payment integration (Razorpay checkout)

Technology
----------

- React Router v7
- Vite
- TypeScript
- TailwindCSS
- Better Auth
- PostgreSQL (via Drizzle ORM)

Getting Started
---------------

Installation
~~~~~~~~~~~~

Install the dependencies:

.. code-block:: bash

   npm install

Development
~~~~~~~~~~~

Start the development server with HMR:

.. code-block:: bash

   npm run dev

Your application will be available at ``http://localhost:3000``.

Building for Production
------------------------

Create a production build:

.. code-block:: bash

   npm run build

Deployment
---------

Docker Deployment
~~~~~~~~~~~~~~~~~

To build and run using Docker:

.. code-block:: bash

   docker build -t studojo-frontend .

   # Run the container
   docker run -p 3000:3000 studojo-frontend

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

Environment Variables
---------------------

- ``VITE_CONTROL_PLANE_URL`` - Control plane API URL
- ``DATABASE_URL`` - PostgreSQL connection string
- ``BETTER_AUTH_SECRET`` - JWT signing secret
- ``GOOGLE_CLIENT_ID``, ``GOOGLE_CLIENT_SECRET`` - OAuth credentials
- ``TWILIO_*`` - SMS OTP configuration

Styling
-------

This application uses Tailwind CSS for styling, configured for a modern, responsive design experience.
