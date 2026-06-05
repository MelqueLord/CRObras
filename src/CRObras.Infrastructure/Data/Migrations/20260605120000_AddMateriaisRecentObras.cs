using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRObras.Infrastructure.Data.Migrations
{
    [Migration("20260605120000_AddMateriaisRecentObras")]
    public partial class AddMateriaisRecentObras : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "materiais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Quantidade = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    PrecoUnitario = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_materiais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_materiais_obras_ObraId",
                        column: x => x.ObraId,
                        principalTable: "obras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_materiais_ObraId",
                table: "materiais",
                column: "ObraId");

            migrationBuilder.CreateTable(
                name: "recent_obras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObraId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadoEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recent_obras", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_recent_obras_UserId_CriadoEm",
                table: "recent_obras",
                columns: new[] { "UserId", "CriadoEm" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "materiais");
            migrationBuilder.DropTable(name: "recent_obras");
        }
    }
}
