FROM mcr.microsoft.com/mssql/server:2019-latest

# ENV ACCEPT_EULA=Y
# ENV SA_PASSWORD=sq!server@admin
# ENV MSSQL_PID=Developer

EXPOSE 1433

VOLUME ["/var/opt/mssql"]

CMD ["/opt/mssql/bin/sqlservr"]
