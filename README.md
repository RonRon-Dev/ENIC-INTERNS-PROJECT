** Internship Project **



## Installation
### Manual Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT.git
    ```
2. Navigate to the project directory:
   ```bash
   cd ENIC-INTERNS-PROJECT
    ```
3. Navigate to the backend directory:
   ```bash
   cd backend
    ```
4. Install the required dependencies:
    ```bash
    dotnet tool install --global dotnet-ef
    dotnet add package Microsoft.AspNetCore.OpenApi
    dotnet add package Microsoft.EntityFrameworkCore
    dotnet add package Microsoft.EntityFrameworkCore.SqlServer
    dotnet add package Microsoft.EntityFrameworkCore.Tools
    ```
5. Migrate the database:
    ```bash
    # Only run this command if you have an existing migration. if not delete the Migrations folder and run the command below.
    dotnet ef migrations add InitialCreate
    dotnet ef database update
    ```
6. Run the backend server:
    ```bash
    dotnet watch run
    ```
7. Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
8. Install the required dependencies:
    ```bash
    npm install
    ```
9. Run the frontend server:
    ```bash
    npm run dev
    ```

## Docker Installation
![> [!IMPORTANT]
> Make sure you have Docker installed before proceeding with the Docker installation steps.](https://www.docker.com/get-started/)

1. clone the repository:
   ```bash
   git clone https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT.git
    ```
2. Navigate to the project directory:
    ```bash
    cd ENIC-INTERNS-PROJECT
    ```
3. Build the Docker images:
    ```bash
    docker-compose up -d --build
    ## If you already have the images built, you can simply run:
    docker-compose up -d
    ```
4. Enter the backend container to run the database migrations:
    ```bash
    docker-compose exec backend dotnet ef database update
    ```
4. Access the application:
    - Frontend: Open your web browser and navigate to `http://localhost:5173` (or the port specified in your Docker configuration).
    - Backend API: The backend API will be accessible at `http://localhost:5000` (or the port specified in your Docker configuration).
5. To stop the Docker containers, run:
    ```bash
    docker-compose down
    ```



