FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

CMD *.csproj 
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0 
#AS runtime

WORKDIR /src

COPY --from=build /src/out .

EXPOSE 80

ENTRYPOINT ["dotnet", "backend.dll"]

