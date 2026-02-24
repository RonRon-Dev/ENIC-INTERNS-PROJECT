# backend/Dockerfile for dev hot reload
FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /app

RUN dotnet tool install --global dotnet-ef

ENV PATH="${PATH}:/root/.dotnet/tools"

EXPOSE 80

# Start ASP.NET with hot reload, HTTP only
CMD ["dotnet", "watch", "run", "--urls", "http://+:80"]
