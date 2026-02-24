using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class TablesRefactoring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_Users_userId",
                table: "ActivityLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_roleId",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "username",
                table: "Users",
                newName: "UserName");

            migrationBuilder.RenameColumn(
                name: "roleId",
                table: "Users",
                newName: "RoleId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Users",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "password",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameIndex(
                name: "IX_Users_roleId",
                table: "Users",
                newName: "IX_Users_RoleId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Roles",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Roles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "userName",
                table: "ActivityLogs",
                newName: "UserName");

            migrationBuilder.RenameColumn(
                name: "userId",
                table: "ActivityLogs",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "userAgent",
                table: "ActivityLogs",
                newName: "UserAgent");

            migrationBuilder.RenameColumn(
                name: "timestamp",
                table: "ActivityLogs",
                newName: "Timestamp");

            migrationBuilder.RenameColumn(
                name: "payload",
                table: "ActivityLogs",
                newName: "Payload");

            migrationBuilder.RenameColumn(
                name: "isSuccess",
                table: "ActivityLogs",
                newName: "IsSuccess");

            migrationBuilder.RenameColumn(
                name: "ipAddress",
                table: "ActivityLogs",
                newName: "IpAddress");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "ActivityLogs",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "activityType",
                table: "ActivityLogs",
                newName: "ActivityType");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "ActivityLogs",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_ActivityLogs_userId",
                table: "ActivityLogs",
                newName: "IX_ActivityLogs_UserId");

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_Users_UserId",
                table: "ActivityLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_Users_UserId",
                table: "ActivityLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "UserName",
                table: "Users",
                newName: "username");

            migrationBuilder.RenameColumn(
                name: "RoleId",
                table: "Users",
                newName: "roleId");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Users",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "Users",
                newName: "password");

            migrationBuilder.RenameIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                newName: "IX_Users_roleId");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Roles",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Roles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserName",
                table: "ActivityLogs",
                newName: "userName");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "ActivityLogs",
                newName: "userId");

            migrationBuilder.RenameColumn(
                name: "UserAgent",
                table: "ActivityLogs",
                newName: "userAgent");

            migrationBuilder.RenameColumn(
                name: "Timestamp",
                table: "ActivityLogs",
                newName: "timestamp");

            migrationBuilder.RenameColumn(
                name: "Payload",
                table: "ActivityLogs",
                newName: "payload");

            migrationBuilder.RenameColumn(
                name: "IsSuccess",
                table: "ActivityLogs",
                newName: "isSuccess");

            migrationBuilder.RenameColumn(
                name: "IpAddress",
                table: "ActivityLogs",
                newName: "ipAddress");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "ActivityLogs",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "ActivityType",
                table: "ActivityLogs",
                newName: "activityType");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "ActivityLogs",
                newName: "id");

            migrationBuilder.RenameIndex(
                name: "IX_ActivityLogs_UserId",
                table: "ActivityLogs",
                newName: "IX_ActivityLogs_userId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_Users_userId",
                table: "ActivityLogs",
                column: "userId",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_roleId",
                table: "Users",
                column: "roleId",
                principalTable: "Roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
