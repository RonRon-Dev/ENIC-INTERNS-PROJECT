FROM mcr.microsoft.com/dotnet/sdk:10.0 as  development
WORKDIR /app
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"
EXPOSE 8080
CMD ["dotnet", "watch", "run", "--urls", "http://+:8080"]

FROM mcr.microsoft.com/dotnet/sdk:10.0 as builder
WORKDIR /app
COPY  *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 as production
WORKDIR /app
COPY --from=builder /publish ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
