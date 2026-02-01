Studojo v2
==========

Microservices-based platform for student productivity tools, with a focus on assignment generation, resume building, and study aids.

Overview
--------

Studojo v2 is a microservices architecture consisting of multiple services working together to provide a comprehensive platform for students. This repository serves as the main entry point and contains all services as git submodules.

Repository Structure
---------------------

This repository uses git submodules to organize the codebase:

- ``frontend/`` - React Router frontend application
- ``services/assignment-gen/`` - Python service for AI-powered assignment generation
- ``services/assignment-gen-worker/`` - Go worker service for processing assignment generation jobs
- ``services/control-plane/`` - Go orchestration service for auth, job lifecycle, and async coordination
- ``services/resume-svc/`` - Go service for generating resume PDFs and packages
- ``services/resume-worker/`` - Go worker service for processing resume jobs
- ``services/humanizer-svc/`` - Python service for structure-preserving document humanization using Rephrasy API
- ``services/humanizer-worker/`` - Go worker service for processing humanizer jobs

Cloning the Repository
-----------------------

To clone this repository with all submodules:

.. code-block:: bash

   git clone --recurse-submodules https://github.com/studojo/studojo.git

If you've already cloned the repository without submodules:

.. code-block:: bash

   git submodule update --init --recursive

Development Setup
-----------------

See ``ARCHITECTURE.md`` for detailed system architecture and component descriptions.

The platform can be run locally using Docker Compose:

.. code-block:: bash

   docker-compose up

This will start all services including:

- PostgreSQL (port 5432)
- RabbitMQ (port 5672)
- Control Plane API (port 8080)
- Frontend (port 3000)
- All worker services

Individual Service Repositories
-------------------------------

Each service is maintained in its own repository:

- `Frontend <https://github.com/studojo/frontend>`_
- `Assignment Gen <https://github.com/studojo/assignment-gen>`_
- `Assignment Gen Worker <https://github.com/studojo/assignment-gen-worker>`_
- `Control Plane <https://github.com/studojo/control-plane>`_
- `Resume Service <https://github.com/studojo/resume-svc>`_
- `Resume Worker <https://github.com/studojo/resume-worker>`_
- `Humanizer Service <https://github.com/studojo/humanizer-svc>`_
- `Humanizer Worker <https://github.com/studojo/humanizer-worker>`_

For detailed documentation on each service, refer to the README.rst file in each service directory.

Architecture
------------

For a complete overview of the system architecture, message flows, and deployment details, see ``ARCHITECTURE.md``.
