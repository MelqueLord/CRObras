using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRObras.Infrastructure.Data.Migrations
{
    [Migration("20260606120000_AddFornecedorToMateriais")]
    public partial class AddFornecedorToMateriais : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FornecedorId",
                table: "materiais",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_materiais_FornecedorId",
                table: "materiais",
                column: "FornecedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_materiais_fornecedores_FornecedorId",
                table: "materiais",
                column: "FornecedorId",
                principalTable: "fornecedores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_materiais_fornecedores_FornecedorId",
                table: "materiais");

            migrationBuilder.DropIndex(
                name: "IX_materiais_FornecedorId",
                table: "materiais");

            migrationBuilder.DropColumn(
                name: "FornecedorId",
                table: "materiais");
        }
    }
}
